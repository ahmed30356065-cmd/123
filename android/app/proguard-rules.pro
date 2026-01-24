# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in 'proguard-android-optimize.txt' which is shipped with the Android SDK.

# Keep Attributes essential for runtime reflection/viewing
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keepattributes Signature
-keepattributes Exceptions

# Keep JS Interfaces explicitly
-keepclassmembers class com.goo.now.a.MainActivity$WebAppInterface {
    public *;
}
-keepclassmembers class com.goo.now.a.MainActivity$AndroidInterface {
    public *;
}

# General Keep for any class with JavascriptInterface (Safety net)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Firebase (Safety net, though usually auto-included)
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Ensure MainActivity is kept as the entry point
-keep class com.goo.now.a.MainActivity { *; }

# --- Aggressive Obfuscation (User Requested) ---
# Flatten package hierarchy to 'x' (hides directory structure)
-repackageclasses 'x'

# Allow R8/ProGuard to modify access modifiers (e.g. private to public) for better inlining
-allowaccessmodification

# aggressive overloading (reuses same method names with different signatures)
# WARNING: This might break some reflection-heavy libraries if not carefully tested
-overloadaggressively

# Remove attributes that give away code structure (optional, but requested for high security)
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keepattributes Signature
-keepattributes Exceptions
# Removing SourceFile/LineNumberTable makes stacktraces useless but code harder to map
-renamesourcefileattribute '' 
-keepattributes SourceFile,LineNumberTable

