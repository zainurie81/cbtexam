package com.seb.exam.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import com.seb.exam.api.ApiClient
import kotlinx.coroutines.*
import java.io.IOException

class HeartbeatService : Service() {

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    
    private var sessionId: Long = -1
    private var currentQuestionIndex: Int = 0
    private var heartbeatIntervalMs: Long = 4000
    private var isRunning = false

    companion object {
        const val CHANNEL_ID = "HeartbeatServiceChannel"
        const val EXTRA_SESSION_ID = "sessionId"
        const val ACTION_LOCK_TRIGGERED = "com.seb.exam.ACTION_LOCK_TRIGGERED"
        const val ACTION_METRICS_UPDATED = "com.seb.exam.ACTION_METRICS_UPDATED"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        sessionId = intent?.getLongExtra(EXTRA_SESSION_ID, -1) ?: -1
        
        if (sessionId != -1L && !isRunning) {
            isRunning = true
            startForegroundNotification()
            startHeartbeatLoop()
        }
        
        return START_NOT_STICKY
    }

    private fun startForegroundNotification() {
        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SEB Secure Exam Active")
            .setContentText("Supervising integrity locks and connection status...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(Notification.CATEGORY_SERVICE)
            .build()
        
        startForeground(1, notification)
    }

    private fun startHeartbeatLoop() {
        serviceScope.launch {
            while (isActive && isRunning) {
                sendHeartbeatToServer()
                delay(heartbeatIntervalMs)
            }
        }
    }

    private suspend fun sendHeartbeatToServer() {
        try {
            val batteryLevel = getBatteryLevel()
            val ramUsage = getRamUsagePercentage()
            
            val startTime = SystemClock.elapsedRealtime()
            val response = ApiClient.getService().sendHeartbeat(
                sessionId = sessionId,
                body = mapOf(
                    "battery_level" to batteryLevel,
                    "ram_usage_pct" to ramUsage,
                    "ping_ms" to 0, // updated after response
                    "current_question_index" to currentQuestionIndex,
                    "status" to "active"
                )
            )
            val endTime = SystemClock.elapsedRealtime()
            val pingMs = (endTime - startTime).toInt()

            if (response.isSuccessful) {
                val data = response.body()
                if (data != null) {
                    // Update ping details
                    ApiClient.getService().sendHeartbeat(
                        sessionId = sessionId,
                        body = mapOf("ping_ms" to pingMs)
                    )

                    if (data.is_locked) {
                        // Broadcast lock app signal
                        sendBroadcast(Intent(ACTION_LOCK_TRIGGERED))
                    }
                    
                    // Notify UI about current stats
                    val updateIntent = Intent(ACTION_METRICS_UPDATED).apply {
                        putExtra("ping", pingMs)
                        putExtra("battery", batteryLevel)
                        putExtra("ram", ramUsage)
                    }
                    sendBroadcast(updateIntent)
                }
            }
        } catch (e: Exception) {
            // Offline Mode or Network loss -> Room log syncing happens via WorkManager sync queue
        }
    }

    private fun getBatteryLevel(): Int {
        val batteryManager = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        return batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }

    private fun getRamUsagePercentage(): Int {
        val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)
        val usedRam = memoryInfo.totalMem - memoryInfo.availMem
        return ((usedRam.toDouble() / memoryInfo.totalMem.toDouble()) * 100).toInt()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Secure Exam Monitor Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }

    override fun onDestroy() {
        isRunning = false
        serviceJob.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
