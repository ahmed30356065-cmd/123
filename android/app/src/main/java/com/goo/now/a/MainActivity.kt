package com.goo.now.a

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import com.google.firebase.FirebaseException
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    // Splash removed - now handled by SplashActivity
    
    // Network Monitoring
    private lateinit var connectivityManager: ConnectivityManager
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    // Permission request launcher
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            // FCM SDK (and your app) can post notifications.
        } else {
            // Inform user that that your app will not show notifications.
            // Toast.makeText(this, "Notifications permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    // Upload Callback
    private var uploadMessage: android.webkit.ValueCallback<Array<android.net.Uri>>? = null

    // File Chooser Launcher
    private val fileChooserLauncher = registerForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            val intent = result.data
            var results: Array<android.net.Uri>? = null
            
            if (intent != null) {
                val dataString = intent.dataString
                if (intent.clipData != null) {
                    val clipData = intent.clipData
                    results = Array(clipData!!.itemCount) { i ->
                        clipData.getItemAt(i).uri
                    }
                } else if (dataString != null) {
                    results = arrayOf(android.net.Uri.parse(dataString))
                }
            }
            uploadMessage?.onReceiveValue(results)
        } else {
            uploadMessage?.onReceiveValue(null)
        }
        uploadMessage = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 1. Edge-to-Edge
        androidx.core.view.WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = android.graphics.Color.TRANSPARENT

        // 2. Set Content View from XML
        setContentView(com.goo.now.a.R.layout.activity_main)
        
        // 3. Bind Views
        webView = findViewById(com.goo.now.a.R.id.webview)
        
        // 4. Create Notification Channel (CRITICAL for Android 8+)
        createNotificationChannel()

        // 5. Start Entrance Animation (Native Splash Overlay)
        val splashOverlay = findViewById<android.widget.LinearLayout>(com.goo.now.a.R.id.splashOverlay)
        val textGoo = findViewById<android.widget.TextView>(com.goo.now.a.R.id.textGoo)
        val textNow = findViewById<android.widget.TextView>(com.goo.now.a.R.id.textNow)

        // Initial State
        splashOverlay.visibility = android.view.View.VISIBLE
        textGoo.translationX = -50f
        textGoo.alpha = 0f
        textNow.translationX = 50f
        textNow.alpha = 0f

        // Animate text
        textGoo.animate().translationX(0f).alpha(1f).setDuration(800)
            .setInterpolator(android.view.animation.DecelerateInterpolator()).start()
            
        textNow.animate().translationX(0f).alpha(1f).setDuration(800)
            .setStartDelay(100).setInterpolator(android.view.animation.DecelerateInterpolator()).start()

        setupWebView()
        setupBackNavigation() 
        askNotificationPermission()
        setupNetworkMonitoring()
        
        // Check for saved state
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            // Load the Web App from local assets ONLY if no saved state
            webView.loadUrl("file:///android_asset/public/index.html")
        }
        
        // Log FCM Token
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) return@addOnCompleteListener
            println("FCM Token: ${task.result}")
        }

        
        // Handle Initial Intent (Notification Click from Cold Start)
        handleIntent(intent)
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }


    private fun handleIntent(intent: android.content.Intent?) {
        if (intent?.extras != null) {
            val url = intent.getStringExtra("url") ?: intent.getStringExtra("link") ?: intent.getStringExtra("target")
            
            if (!url.isNullOrEmpty()) {
                // ALWAYS pass to JS to handle logic/routing. 
                // Never navigate WebView away from the SPA unless JS decides to.
                webView.post {
                    webView.evaluateJavascript("window.handleDeepLink && window.handleDeepLink('$url')", null)
                }
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelId = "high_importance_channel_v2" // Versioned to force update
            val channelName = "Order Notifications v2"
            val channelDescription = "Important updates about your orders"
            val importance = android.app.NotificationManager.IMPORTANCE_HIGH
            
            val channel = android.app.NotificationChannel(channelId, channelName, importance).apply {
                description = channelDescription
                enableVibration(true)
                enableLights(true)
            }
            
            val notificationManager = getSystemService(android.app.NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
        }
    }


    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            useWideViewPort = true
            loadWithOverviewMode = true
            
            allowFileAccess = true
            allowContentAccess = true
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
            
            textZoom = 100
            
            // Append Custom Tag to User Agent for immediate detection by Web App
            userAgentString = "$userAgentString GOO_NATIVE_APP"
        }
        
        
        // CLEAR CACHE TO ENSURE UPDATES ARE SEEN
        webView.clearCache(true)
        
        // Javascript Interface to allow Web to close Splash
        // Main Bridge for Notifications
        webView.addJavascriptInterface(AndroidInterface(this), "Android")
        // Splash Control Bridge
        webView.addJavascriptInterface(AndroidSplashInterface(), "AndroidSplash")
        
        // Performance
        webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null)
        webView.setBackgroundColor(android.graphics.Color.TRANSPARENT)
        
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: android.webkit.WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                return handleUrl(url)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                return handleUrl(url ?: "")
            }

            private fun handleUrl(url: String): Boolean {
                if (url.startsWith("tel:") || 
                    url.startsWith("whatsapp:") || 
                    url.startsWith("mailto:") ||
                    url.startsWith("intent:") ||
                    url.contains("wa.me") || 
                    url.contains("api.whatsapp.com")) {
                    try {
                        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                        startActivity(intent)
                    } catch (e: Exception) {
                        e.printStackTrace()
                        // context might be needed if not in activity
                    }
                    return true
                }
                return false
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: android.webkit.ValueCallback<Array<android.net.Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                if (uploadMessage != null) {
                    uploadMessage?.onReceiveValue(null)
                    uploadMessage = null
                }

                uploadMessage = filePathCallback

                val intent = fileChooserParams?.createIntent()
                try {
                    fileChooserLauncher.launch(intent)
                } catch (e: Exception) {
                    uploadMessage = null
                    return false
                }
                return true
            }
        }
    }


    // Inner class for Main Bridge (Notifications & Logic)
    inner class AndroidInterface(private val activity: MainActivity) {

        @android.webkit.JavascriptInterface
        fun subscribeToTopic(topic: String) {
            FirebaseMessaging.getInstance().subscribeToTopic(topic)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        android.util.Log.d("FCM", "Subscribed to topic: $topic")
                        // Toast removed per request
                    } else {
                        android.util.Log.e("FCM", "Failed to subscribe to topic: $topic")
                    }
                }
        }

        @android.webkit.JavascriptInterface
        fun unsubscribeFromTopic(topic: String) {
            FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
            // Toast removed per request
            android.util.Log.d("FCM", "Unsubscribing from: $topic")
        }

        @android.webkit.JavascriptInterface
        fun setAppRole(role: String) {
             android.util.Log.d("Bridge", "Role set to: $role")
        }

        @android.webkit.JavascriptInterface
        fun setActiveNotificationChannel(channelId: String) {
            android.util.Log.d("Bridge", "Active Channel set to: $channelId")
            // Can be used to filter notifications in foreground if needed
        }

        @android.webkit.JavascriptInterface
        fun showAndroidNotification(title: String, body: String) {
            // Trigger local notification if needed (mostly for testing or foreground alerts)
            // Implementation optional as FCM handles background usually
        }

        @android.webkit.JavascriptInterface
        fun playNotificationSound() {
            try {
                val notification = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION)
                val r = android.media.RingtoneManager.getRingtone(activity.applicationContext, notification)
                r.play()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        @android.webkit.JavascriptInterface
        fun vibrate(duration: Long) {
            val v = activity.getSystemService(android.content.Context.VIBRATOR_SERVICE) as android.os.Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(android.os.VibrationEffect.createOneShot(duration, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(duration)
            }
        }
        
        @android.webkit.JavascriptInterface
        fun onLoginSuccess(userJson: String) {
             android.util.Log.d("Bridge", "Login Success: $userJson")
        }

        @android.webkit.JavascriptInterface
        fun onLogout(userId: String?, role: String?) {
             android.util.Log.d("Bridge", "User Logged Out - Performing NUCLEAR CLEANUP. ID: $userId, Role: $role")
             
             // 1. Unsubscribe from ALL known general topics (v1 and v2)
             val topics = listOf(
                 "admin", "drivers", "merchants", "users", "all_users",
                 "driver", "merchant", "user", "customer", // Legacy/Singular variants
                 "admin_v2", "drivers_v2", "merchants_v2", "users_v2", "all_users_v2" // v2 Variants
             )
             for (topic in topics) {
                 FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
                     .addOnCompleteListener { task ->
                        if (task.isSuccessful) android.util.Log.d("FCM", "Unsubscribed from: $topic")
                     }
             }

             // 2. Unsubscribe from Specific User ID Channels (Targeted unsubscribe)
             if (userId != null) {
                 // Try ALL possible role prefixes for this ID to be sure
                 val prefixes = listOf("driver", "merchant", "user", "customer", "admin", "supervisor")
                 for (prefix in prefixes) {
                     val topic = "${prefix}_${userId}"
                     val topicV2 = "${prefix}_${userId}_v2"
                     
                     FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
                     FirebaseMessaging.getInstance().unsubscribeFromTopic(topicV2)
                         .addOnCompleteListener { 
                            android.util.Log.d("FCM", "Unsubscribed from potential ID topic: $topic / $topicV2")
                         }
                 }
                 // Legacy raw ID
                 FirebaseMessaging.getInstance().unsubscribeFromTopic(userId)
             }
             
             // 3. Clear Cache again just in case
             activity.runOnUiThread {
                activity.webView.clearCache(true)
             }
        }

        @android.webkit.JavascriptInterface
        fun onContextChange(context: String) {
             android.util.Log.d("Bridge", "Context: $context")
        }
        
        @android.webkit.JavascriptInterface
        fun downloadAndInstallApk(url: String, fileName: String) {
            activity.runOnUiThread {
                try {
                    val request = android.app.DownloadManager.Request(android.net.Uri.parse(url))
                    request.setTitle(fileName)
                    request.setDescription("جاري تحميل تحديث GOO NOW...")
                    request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, fileName)
                    request.setMimeType("application/vnd.android.package-archive")
                    
                    val dm = activity.getSystemService(android.content.Context.DOWNLOAD_SERVICE) as android.app.DownloadManager
                    dm.enqueue(request)
                    
                    android.util.Log.d("APK_DOWNLOAD", "Download started: $fileName")
                    
                    android.widget.Toast.makeText(
                        activity.applicationContext,
                        "جاري تحميل التحديث... سيتم فتح التثبيت بعد الانتهاء",
                        android.widget.Toast.LENGTH_LONG
                    ).show()
                    
                } catch (e: Exception) {
                    android.util.Log.e("APK_DOWNLOAD", "Download failed: ${e.message}")
                    android.widget.Toast.makeText(
                        activity.applicationContext,
                        "فشل بدء التحميل",
                        android.widget.Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }

        @android.webkit.JavascriptInterface
        fun verifyPhoneNumber(phoneNumber: String) {
            activity.runOnUiThread {
                try {
                     val auth = FirebaseAuth.getInstance()
                     // Force language to Arabic for SMS
                     auth.useAppLanguage() 
                     
                     val callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
                        override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                            // Auto-retrieval or instant verification
                            val code = credential.smsCode
                            if (code != null) {
                                activity.webView.evaluateJavascript("window.onPhoneAuthAutoRetrieval && window.onPhoneAuthAutoRetrieval('$code')", null)
                            } else {
                                signInWithPhoneAuthCredential(credential)
                            }
                        }

                        override fun onVerificationFailed(e: FirebaseException) {
                            android.util.Log.e("PhoneAuth", "Verification Failed", e)
                            activity.webView.evaluateJavascript("window.onPhoneAuthError && window.onPhoneAuthError('${e.message}')", null)
                        }

                        override fun onCodeSent(verificationId: String, token: PhoneAuthProvider.ForceResendingToken) {
                            android.util.Log.d("PhoneAuth", "Code Sent: $verificationId")
                            activity.webView.evaluateJavascript("window.onPhoneAuthCodeSent && window.onPhoneAuthCodeSent('$verificationId')", null)
                        }
                    }

                    val options = PhoneAuthOptions.newBuilder(auth)
                        .setPhoneNumber(phoneNumber)       
                        .setTimeout(60L, TimeUnit.SECONDS) 
                        .setActivity(activity)             
                        .setCallbacks(callbacks)          
                        .build()
                    PhoneAuthProvider.verifyPhoneNumber(options)

                } catch (e: Exception) {
                    android.util.Log.e("PhoneAuth", "Error starting verification", e)
                    activity.webView.evaluateJavascript("window.onPhoneAuthError && window.onPhoneAuthError('Error: ${e.message}')", null)
                }
            }
        }

        @android.webkit.JavascriptInterface
        fun submitOtp(verificationId: String, code: String) {
            activity.runOnUiThread {
                try {
                    val credential = PhoneAuthProvider.getCredential(verificationId, code)
                    signInWithPhoneAuthCredential(credential)
                } catch (e: Exception) {
                     activity.webView.evaluateJavascript("window.onPhoneAuthError && window.onPhoneAuthError('${e.message}')", null)
                }
            }
        }

        private fun signInWithPhoneAuthCredential(credential: PhoneAuthCredential) {
             val auth = FirebaseAuth.getInstance()
             auth.signInWithCredential(credential)
                .addOnCompleteListener(activity) { task ->
                    if (task.isSuccessful) {
                        val user = task.result?.user
                        val userJson = "{\"uid\": \"${user?.uid}\", \"phoneNumber\": \"${user?.phoneNumber}\"}"
                        activity.webView.evaluateJavascript("window.onPhoneAuthSuccess && window.onPhoneAuthSuccess('$userJson')", null)
                    } else {
                        val msg = task.exception?.message ?: "Sign In Failed"
                        activity.webView.evaluateJavascript("window.onPhoneAuthError && window.onPhoneAuthError('$msg')", null)
                    }
                }
        }
    }

    // Double Back to Exit Logic
    private var doubleBackToExitPressedOnce = false

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : androidx.activity.OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    webView.evaluateJavascript("window.handleAndroidBack && window.handleAndroidBack()") { result ->
                        // If result is "true", JS handled it (e.g. closed a modal). 
                        // If "false" or "null", we are at the root level and should try to exit.
                        if (result == "\"false\"" || result == "null") {
                            
                            if (doubleBackToExitPressedOnce) {
                                isEnabled = false 
                                onBackPressedDispatcher.onBackPressed()
                                return@evaluateJavascript
                            }

                            doubleBackToExitPressedOnce = true
                            
                            // Show Professional Custom Toast
                            showCustomToast("اضغط مرة أخرى للخروج")
                            
                            // Reset flag after 2 seconds
                            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                                doubleBackToExitPressedOnce = false
                            }, 2000)
                        }
                    }
                }
            }
        })
    }
    
    private fun showCustomToast(message: String) {
        val inflater = layoutInflater
        val layout = inflater.inflate(com.goo.now.a.R.layout.custom_toast, null)
        
        val text: android.widget.TextView = layout.findViewById(com.goo.now.a.R.id.toast_text)
        text.text = message
        
        val toast = Toast(applicationContext)
        toast.setGravity(android.view.Gravity.BOTTOM or android.view.Gravity.CENTER_HORIZONTAL, 0, 100)
        toast.duration = Toast.LENGTH_SHORT
        toast.view = layout
        toast.show()
    }

    private fun askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) ==
                PackageManager.PERMISSION_GRANTED
            ) {
            } else if (shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) {
                 requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
    
    private fun setupNetworkMonitoring() {
        connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                super.onAvailable(network)
                runOnUiThread {
                    notifyWebViewNetworkStatus(true)
                }
            }
            
            override fun onLost(network: Network) {
                super.onLost(network)
                runOnUiThread {
                    notifyWebViewNetworkStatus(false)
                }
            }
            
            override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
                super.onCapabilitiesChanged(network, networkCapabilities)
                val hasInternet = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                                networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                runOnUiThread {
                    notifyWebViewNetworkStatus(hasInternet)
                }
            }
        }
        
        val networkRequest = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
            
        networkCallback?.let {
            connectivityManager.registerNetworkCallback(networkRequest, it)
        }
    }
    
    private fun notifyWebViewNetworkStatus(isOnline: Boolean) {
        val status = if (isOnline) "online" else "offline"
        webView.evaluateJavascript(
            "window.dispatchEvent(new Event('$status'));",
            null
        )
        android.util.Log.d("NetworkMonitor", "Network status changed: $status")
    }
    
    override fun onDestroy() {
        super.onDestroy()
        
        // Unregister network callback
        networkCallback?.let {
            connectivityManager.unregisterNetworkCallback(it)
        }
    }

    // Splash Interface - Added to allow JS to control splash visibility
    inner class AndroidSplashInterface {
        @android.webkit.JavascriptInterface
        fun hideSplash() {
            runOnUiThread {
                val splashOverlay = findViewById<android.widget.LinearLayout>(com.goo.now.a.R.id.splashOverlay)
                if (splashOverlay.visibility == android.view.View.VISIBLE) {
                    splashOverlay.animate()
                        .alpha(0f)
                        .setDuration(500)
                        .withEndAction { 
                            splashOverlay.visibility = android.view.View.GONE 
                        }
                        .start()
                }
            }
        }
    }
}
