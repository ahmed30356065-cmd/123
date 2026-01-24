package com.goo.now.a

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    @Suppress("DEPRECATION") // FULL_WAKE_LOCK is deprecated but necessary for turning screen on
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        var wl: PowerManager.WakeLock? = null
        try {
            // 1. Acquire WakeLock to turn on screen
            val wakeLockTag = "DeliNow:UrgentFCM"
            wl = pm.newWakeLock(
                PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                wakeLockTag
            )
            wl?.acquire(5000) // 5 seconds

            // 2. Parse Data
            val data = remoteMessage.data
            var title = data["title"]
            var body = data["body"]
            val url = data["url"]

            // Fallback to Notification Payload if Data is empty
            if (title == null && remoteMessage.notification != null) {
                title = remoteMessage.notification?.title
                body = remoteMessage.notification?.body
            }

            // Defaults
            if (title == null) title = "New Order"
            if (body == null) body = "Check the app now"

            showUrgentNotification(title, body, url)

        } catch (e: Exception) {
            Log.e(TAG, "Error processing FCM message", e)
        } finally {
            if (wl != null && wl.isHeld) {
                wl.release()
            }
        }
    }

    private fun showUrgentNotification(title: String?, body: String?, url: String?) {
        try {
            val intent = Intent(this, MainActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            
            if (url != null) intent.putExtra("url", url)
            intent.putExtra("from_notification", true)

            val pendingIntent = PendingIntent.getActivity(
                this,
                System.currentTimeMillis().toInt(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val channelId = "high_importance_channel" // Align with Web App
            val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE) // Use Ringtone for urgency
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                var channel = notificationManager.getNotificationChannel(channelId)
                if (channel == null) {
                    channel = NotificationChannel(channelId, "Urgent Orders", NotificationManager.IMPORTANCE_HIGH)
                    
                    val audioAttributes = android.media.AudioAttributes.Builder()
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(android.media.AudioAttributes.USAGE_ALARM) // Alarm Usage to bypass some restrictions
                        .build()
                        
                    channel.setSound(soundUri, audioAttributes)
                    channel.enableLights(true)
                    channel.enableVibration(true)
                    channel.lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                    channel.setBypassDnd(true) // Attempt to bypass Do Not Disturb
                    
                    notificationManager.createNotificationChannel(channel)
                }
            }

            val builder = NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.drawable.ic_launcher) // App Icon
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setSound(soundUri)
                .setVibrate(longArrayOf(0, 1000, 1000, 1000, 1000)) // Long vibration
                .setFullScreenIntent(pendingIntent, true) // Critical for Head-Up on locked screen
                .setContentIntent(pendingIntent)

            notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())

        } catch (e: Exception) {
            Log.e(TAG, "Failed to show notification", e)
        }
    }

    companion object {
        private const val TAG = "MyFirebaseMsgService"
    }
}
