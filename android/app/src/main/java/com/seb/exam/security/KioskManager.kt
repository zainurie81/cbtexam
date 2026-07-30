package com.seb.exam.security

import android.app.Activity
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Settings
import android.view.View

class KioskManager(private val context: Context) {

    private val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager

    /**
     * Start Lock Task Mode (Kiosk Mode).
     * If the app is set as Device Owner, this will lock the screen completely
     * without showing standard prompt confirmations.
     */
    fun startKioskMode(activity: Activity) {
        try {
            // Apply Window Flags for secure window (blocks screenshots and recording)
            activity.window.setFlags(
                android.view.WindowManager.LayoutParams.FLAG_SECURE,
                android.view.WindowManager.LayoutParams.FLAG_SECURE
            )

            // Hide System Navigation bar & Status bar (Immersive Mode)
            hideSystemUI(activity)

            // Check if app is set as Device Owner
            val adminComponent = ComponentName(context, KioskAdminReceiver::class.java)
            if (devicePolicyManager.isDeviceOwnerApp(context.packageName)) {
                // Whitelist our package to allow locking without prompt
                val packages = arrayOf(context.packageName)
                devicePolicyManager.setLockTaskPackages(adminComponent, packages)
            }

            // Start pinning/locking activity
            activity.startLockTask()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Stop Lock Task Mode (Exit Kiosk Mode).
     */
    fun stopKioskMode(activity: Activity) {
        try {
            activity.stopLockTask()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Hide Navigation and Status bars completely using Immersive Mode.
     */
    @Suppress("DEPRECATION")
    fun hideSystemUI(activity: Activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            activity.window.setDecorFitsSystemWindows(false)
            val controller = activity.window.insetsController
            if (controller != null) {
                controller.hide(android.view.WindowInsets.Type.statusBars() or android.view.WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior = android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            activity.window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
            )
        }
    }

    /**
     * Helper to verify if the app is currently running in lock task mode.
     */
    fun isLocked(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            activityManager.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_LOCKED
        } else {
            @Suppress("DEPRECATION")
            activityManager.isInLockTaskMode
        }
    }
}

/**
 * Placeholder broadcast receiver for device admin declaration.
 */
class KioskAdminReceiver : android.app.admin.DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
    }
}
