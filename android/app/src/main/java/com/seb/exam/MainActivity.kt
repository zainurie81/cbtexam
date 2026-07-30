package com.seb.exam

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.seb.exam.api.ApiClient
import com.seb.exam.security.AntiCheatDetector
import com.seb.exam.security.KioskManager
import com.seb.exam.service.HeartbeatService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {

    private lateinit var kioskManager: KioskManager
    private lateinit var antiCheatDetector: AntiCheatDetector

    private var activeSessionId: Long? = null

    // Real-time telemetry metrics
    private val pingMs = mutableStateOf(0)
    private val batteryLevel = mutableStateOf(100)
    private val ramUsage = mutableStateOf(0)
    private val isDeviceLocked = mutableStateOf(false)

    private val metricsReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                HeartbeatService.ACTION_METRICS_UPDATED -> {
                    pingMs.value = intent.getIntExtra("ping", 0)
                    batteryLevel.value = intent.getIntExtra("battery", 100)
                    ramUsage.value = intent.getIntExtra("ram", 0)
                }
                HeartbeatService.ACTION_LOCK_TRIGGERED -> {
                    isDeviceLocked.value = true
                    Toast.makeText(this@MainActivity, "Device Locked by Administrator", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        kioskManager = KioskManager(this)
        antiCheatDetector = AntiCheatDetector(this)

        // Register metrics receiver
        val filter = IntentFilter().apply {
            addAction(HeartbeatService.ACTION_METRICS_UPDATED)
            addAction(HeartbeatService.ACTION_LOCK_TRIGGERED)
        }
        registerReceiver(metricsReceiver, filter, Context.RECEIVER_NOT_EXPORTED)

        setContent {
            var screenState by remember { mutableStateOf("splash") } // splash, config, webview, locked, maintenance, update
            var splashProgressText by remember { mutableStateOf("Initializing system parameters...") }
            var splashErrorText by remember { mutableStateOf<String?>(null) }
            
            var serverUrl by remember { mutableStateOf("http://10.0.2.2:8000") }
            var examPin by remember { mutableStateOf("") }
            var studentEmail by remember { mutableStateOf("student1@seb.com") }
            var studentPassword by remember { mutableStateOf("password") }

            // Handle lock screen override
            if (isDeviceLocked.value) {
                screenState = "locked"
            }

            when (screenState) {
                "splash" -> SplashScreen(
                    progressText = splashProgressText,
                    errorText = splashErrorText,
                    onRetry = {
                        splashErrorText = null
                        runBootChecks(
                            serverUrl = serverUrl,
                            onProgress = { splashProgressText = it },
                            onError = { splashErrorText = it },
                            onFinish = { state -> screenState = state }
                        )
                    }
                )
                "config" -> ConfigScreen(
                    serverUrl = serverUrl,
                    examPin = examPin,
                    email = studentEmail,
                    password = studentPassword,
                    onServerUrlChange = { serverUrl = it },
                    onExamPinChange = { examPin = it },
                    onEmailChange = { studentEmail = it },
                    onPasswordChange = { studentPassword = it },
                    onVerifyAndConnect = {
                        verifyAndStartExam(serverUrl, examPin, studentEmail, studentPassword) { sessionId, success ->
                            if (success) {
                                activeSessionId = sessionId
                                kioskManager.startKioskMode(this@MainActivity)
                                screenState = "webview"
                            }
                        }
                    }
                )
                "webview" -> ExamWebViewScreen(
                    url = "https://wayground.com/join",
                    ping = pingMs.value,
                    battery = batteryLevel.value,
                    ram = ramUsage.value,
                    onSubmit = {
                        stopExamSession()
                        screenState = "config"
                    }
                )
                "locked" -> LockScreen()
                "maintenance" -> MaintenanceScreen(onRetry = { screenState = "splash" })
                "update" -> ForceUpdateScreen()
            }

            // Run boot verification sequence once UI displays
            LaunchedEffect(Unit) {
                runBootChecks(
                    serverUrl = serverUrl,
                    onProgress = { splashProgressText = it },
                    onError = { splashErrorText = it },
                    onFinish = { state -> screenState = state }
                )
            }
        }
    }

    /**
     * Run boot pipeline check sequence.
     */
    private fun runBootChecks(
        serverUrl: String,
        onProgress: (String) -> Unit,
        onError: (String) -> Unit,
        onFinish: (String) -> Unit
    ) {
        CoroutineScope(Dispatchers.Main).launch {
            // 1. Cek Internet
            onProgress("Checking network connectivity...")
            delay(1000)
            if (!isNetworkAvailable()) {
                onError("No Internet Connection detected. Please connect to a network and retry.")
                return@launch
            }

            // 2. Cek Konfigurasi Server
            onProgress("Querying configuration from gateway server...")
            delay(1000)
            ApiClient.setBaseUrl(serverUrl)
            val configFetchResult = withContext(Dispatchers.IO) {
                try {
                    val response = ApiClient.getService().getExams() // test ping API
                    response.isSuccessful
                } catch (e: Exception) {
                    false
                }
            }

            if (!configFetchResult) {
                onError("Could not reach gateway server gateway at: $serverUrl. Verify address or connection.")
                return@launch
            }

            // 3. Cek Update & Cek Maintenance Mode status
            onProgress("Checking maintenance status and updates...")
            delay(1000)
            
            // Check status endpoint
            val statusResult = withContext(Dispatchers.IO) {
                try {
                    val res = ApiClient.getService().login(mapOf("test" to "test")) // dummy auth trigger to fetch config
                    // Fallback configuration if login checks failed but server is active
                    res.code() != 404
                } catch (e: Exception) {
                    true
                }
            }

            if (!statusResult) {
                onFinish("maintenance")
                return@launch
            }

            onProgress("System parameters checked. Booting secure layer...")
            delay(500)
            onFinish("config")
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val actList = connectivityManager.getNetworkCapabilities(network) ?: return false
        return actList.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                actList.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                actList.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
    }

    private fun verifyAndStartExam(
        serverUrl: String,
        pin: String,
        email: String,
        pass: String,
        callback: (Long, Boolean) -> Unit
    ) {
        if (antiCheatDetector.isDeviceRooted()) {
            Toast.makeText(this, "Security Breach: Root detected. Exam blocked.", Toast.LENGTH_LONG).show()
            callback(-1, false)
            return
        }

        if (antiCheatDetector.isRunningOnEmulator()) {
            Toast.makeText(this, "Security Breach: Emulator environment detected. Exam blocked.", Toast.LENGTH_LONG).show()
            callback(-1, false)
            return
        }

        ApiClient.setBaseUrl(serverUrl)

        CoroutineScope(Dispatchers.Main).launch {
            try {
                // 1. Authenticate user
                val authRes = ApiClient.getService().login(mapOf("email" to email, "password" to pass, "device_id" to "device_android_hash_1"))
                if (authRes.isSuccessful && authRes.body() != null) {
                    val token = authRes.body()!!.token
                    ApiClient.setAuthToken(token)

                    // 2. Join exam using PIN
                    val joinRes = ApiClient.getService().joinExam(mapOf("token" to pin, "device_id" to "device_android_hash_1"))
                    if (joinRes.isSuccessful && joinRes.body() != null) {
                        val examId = joinRes.body()!!.exam.id

                        // 3. Start Session
                        val sessionRes = ApiClient.getService().startSession(mapOf("exam_id" to examId, "device_id" to "device_android_hash_1"))
                        if (sessionRes.isSuccessful && sessionRes.body() != null) {
                            val sessionId = sessionRes.body()!!.session.id

                            // Start background heartbeat
                            val intent = Intent(this@MainActivity, HeartbeatService::class.java).apply {
                                putExtra(HeartbeatService.EXTRA_SESSION_ID, sessionId)
                            }
                            startService(intent)

                            callback(sessionId, true)
                            return@launch
                        }
                    }
                }
                Toast.makeText(this@MainActivity, "Connection or validation failed.", Toast.LENGTH_SHORT).show()
                callback(-1, false)
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Connection error: ${e.message}", Toast.LENGTH_SHORT).show()
                callback(-1, false)
            }
        }
    }

    private fun stopExamSession() {
        activeSessionId?.let { sessionId ->
            CoroutineScope(Dispatchers.Main).launch {
                try {
                    ApiClient.getService().submitExam(sessionId)
                } catch (e: Exception) { }
            }
        }
        val intent = Intent(this, HeartbeatService::class.java)
        stopService(intent)
        kioskManager.stopKioskMode(this)
        isDeviceLocked.value = false
    }

    override fun onDestroy() {
        unregisterReceiver(metricsReceiver)
        super.onDestroy()
    }

    override fun onBackPressed() {
        // Suppress back button exit
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_UP || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            return true // swallow event
        }
        return super.onKeyDown(keyCode, event)
    }
}

@Composable
fun SplashScreen(
    progressText: String,
    errorText: String?,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Logo Container
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .background(Color(0xFF312E81), shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "SEB",
                    color = Color.White,
                    fontWeight = FontWeight.Black,
                    fontSize = 24.sp
                )
            }

            Text(
                text = "SECURE EXAM BROWSER",
                color = Color.White,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )

            if (errorText == null) {
                CircularProgressIndicator(color = Color(0xFF6366F1))
                Text(
                    text = progressText,
                    color = Color.LightGray,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center
                )
            } else {
                Text(
                    text = errorText,
                    color = Color.Red,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center
                )
                Button(
                    onClick = onRetry,
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
                ) {
                    Text("Retry Checks", color = Color.White)
                }
            }
        }
    }
}

@Composable
fun ForceUpdateScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("UPDATE REQUIRED", color = Color.Red, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text(
                text = "Your app version is no longer supported. Please install the latest release from the exam portal to proceed.",
                color = Color.White,
                textAlign = TextAlign.Center,
                fontSize = 14.sp
            )
        }
    }
}

@Composable
fun MaintenanceScreen(onRetry: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("SERVER MAINTENANCE", color = Color.Yellow, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text(
                text = "The CBT gateway is currently undergoing maintenance. Please try again later or contact your proctor.",
                color = Color.White,
                textAlign = TextAlign.Center,
                fontSize = 14.sp
            )
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
            ) {
                Text("Refresh Connection", color = Color.White)
            }
        }
    }
}

@Composable
fun ConfigScreen(
    serverUrl: String,
    examPin: String,
    email: String,
    password: String,
    onServerUrlChange: (String) -> Unit,
    onExamPinChange: (String) -> Unit,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onVerifyAndConnect: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "SECURE EXAM CLIENT",
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace
            )

            OutlinedTextField(
                value = serverUrl,
                onValueChange = onServerUrlChange,
                label = { Text("Server Gateway URL") },
                colors = TextFieldDefaults.colors(
                    unfocusedContainerColor = Color.Transparent,
                    focusedContainerColor = Color.Transparent,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                ),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = examPin,
                onValueChange = onExamPinChange,
                label = { Text("Exam PIN Token") },
                colors = TextFieldDefaults.colors(
                    unfocusedContainerColor = Color.Transparent,
                    focusedContainerColor = Color.Transparent,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                ),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = email,
                onValueChange = onEmailChange,
                label = { Text("Student Email") },
                colors = TextFieldDefaults.colors(
                    unfocusedContainerColor = Color.Transparent,
                    focusedContainerColor = Color.Transparent,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                ),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = password,
                onValueChange = onPasswordChange,
                label = { Text("Student Password") },
                colors = TextFieldDefaults.colors(
                    unfocusedContainerColor = Color.Transparent,
                    focusedContainerColor = Color.Transparent,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = onVerifyAndConnect,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Verify Integrity & Enter Exam", fontWeight = FontWeight.Bold, color = Color.White)
            }
        }
    }
}

@Composable
fun ExamWebViewScreen(
    url: String,
    ping: Int,
    battery: Int,
    ram: Int,
    onSubmit: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Secure Header Info Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF1E293B))
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("SECURE LOCK MODE", color = Color.Red, fontWeight = FontWeight.Bold, fontSize = 12.sp)

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Ping: ${ping}ms", color = Color.LightGray, fontSize = 12.sp)
                Text("Bat: ${battery}%", color = Color.LightGray, fontSize = 12.sp)
                Text("RAM: ${ram}%", color = Color.LightGray, fontSize = 12.sp)
            }

            Button(
                onClick = onSubmit,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Red),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                modifier = Modifier.height(28.dp)
            ) {
                Text("Submit", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Web Client View
        AndroidView(
            factory = { context ->
                WebView(context).apply {
                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                            val targetUrl = request?.url?.toString() ?: ""
                            return if (targetUrl.contains("wayground.com") || targetUrl.contains("smpn4ngantang.sch.id")) {
                                false
                            } else {
                                Toast.makeText(context, "URL is not whitelisted by exam admin.", Toast.LENGTH_SHORT).show()
                                true
                            }
                        }
                    }
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    loadUrl(url)
                }
            },
            modifier = Modifier.fillMaxSize()
        )
    }
}

@Composable
fun LockScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Red)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "DEVICE SECURELY LOCKED",
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Black
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "This device has been locked by exam administrators due to an integrity policy breach. Please contact your proctor to unlock your device.",
                color = Color.White,
                fontSize = 14.sp,
                lineHeight = 20.sp
            )
        }
    }
}
