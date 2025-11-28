# 🚀 Dictaat App - Setup Checklist

## ✅ COMPLETED TASKS

- [x] Project structure created
- [x] All dependencies installed
- [x] Authentication system implemented
- [x] Map screen with POI claiming
- [x] Database schema designed
- [x] UI components built
- [x] Documentation written

## 🔄 REMAINING TASKS

### 1. ✅ Get Mapbox Access Token

**URGENT: Required for maps to work**

1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Create account / Login
3. Click "Create a token" in the Access tokens section
4. Give it a name like "Dictaat App"
5. Copy the token (starts with `pk.ey...`)

### 2. 🗄️ Create Supabase Project

**URGENT: Required for backend to work**

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Choose organization (create one if needed)
4. Fill in:
   - **Name**: `dictaat-app` (or whatever you want)
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest to your users (e.g., EU West for Europe)
5. Click "Create new project"
6. Wait 2-3 minutes for provisioning

### 3. 🔑 Get Supabase API Keys

**After project is created:**

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 4. ✅ Create Environment File

**CRITICAL: App won't work without this**

1. In your project root, create a file named `.env`
2. Copy this content:

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJ5b3VyLXRva2VuIn0...
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Replace the placeholder values with your real keys

### 5. ✅ Run Database Schema

**After Supabase project is ready:**

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire content from `database/schema.sql`
4. Click "Run" (this might take a few minutes)
5. Check that all tables were created successfully

### 6. 🧪 Test the App

**After all setup is complete:**

```bash
# Start the development server
npx expo start

# Test on iOS simulator
npx expo start --ios

# Test on Android emulator
npx expo start --android
```

### 7. 🔧 Configure App Permissions

**For location services to work:**

**iOS:**
- The app.json already has location permissions configured
- iOS will ask for permission when app starts

**Android:**
- The app.json already has location permissions configured
- Android will ask for permission when app starts

## 🎯 TESTING CHECKLIST

- [ ] Can create new account
- [ ] Can login with existing account
- [ ] Map loads and shows user location
- [ ] Nearby POIs appear on map
- [ ] Can tap POI markers
- [ ] Can start claiming (shows timer)
- [ ] Can stop claiming (shows minutes earned)
- [ ] Leaderboard shows current king
- [ ] Profile shows user stats

## 🚀 DEPLOYMENT (Optional)

Once everything works locally:

### iOS App Store
```bash
# Install EAS CLI
npm install -g @expo/cli

# Configure EAS (first time only)
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Google Play Store
```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

## 🆘 TROUBLESHOOTING

### Map doesn't load
- Check Mapbox token in `.env`
- Make sure token has correct permissions
- Check console for Mapbox errors

### Can't login/signup
- Check Supabase URL and anon key in `.env`
- Verify project is not paused in Supabase dashboard
- Check Supabase logs for errors

### Database errors
- Make sure schema.sql ran successfully
- Check RLS policies are enabled
- Verify table names match the code

### Location not working
- Grant location permissions when prompted
- Test on physical device (simulators may have issues)
- Check device GPS settings

## 📞 SUPPORT

If you get stuck:
1. Check the main README.md for detailed instructions
2. Look at Supabase dashboard logs
3. Check Expo development server console
4. Verify all environment variables are set correctly

## 🎉 SUCCESS CHECKLIST

- [x] `.env` file exists with correct keys
- [x] Supabase project is active
- [x] Database schema ran successfully
- [x] Mapbox access token configured
- [ ] Can login and see the map
- [ ] POIs load and claiming works
- [ ] Ready for users to play! 🎮
