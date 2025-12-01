# ⚔️ Fealty - Territory Claiming Game

**Show Fealty to Become King**

A location-based mobile game where players claim physical Points of Interest by **actually being present**. No quick drive-bys, but real visits with genuine dedication. Show loyalty to your territory, become King, and dominate your city!

## 🎮 Core Game Mechanic

### Entry Mode
Walk into a POI's radius → **Progress arc** appears → Complete entry timer
- **Normal users**: 60 seconds entry timer
- **👑 Kings**: 25 seconds entry timer (the land recognizes its ruler!)

### Capture Mode (up to 60 seconds)
After entry completes → Timer starts counting → Earn 1 second per second → **Bonus: +10 seconds for completing a full minute!**

**Leave the radius?** Your captured time is saved for the leaderboard!

## 🚀 Features

### Core Gameplay
- **🎯 Two-Phase Capture System** - Entry mode (60s normal / 25s for kings) → Capture mode (60s max)
- **👑 King Bonus** - Kings get reduced entry timer with visual gold feedback
- **⏱️ Real-time Timer** - Watch your captured seconds grow
- **🎁 Minute Bonus** - Complete 60 seconds for +10 bonus seconds!
- **📊 Crown System** - Rankings based on number of POIs where you're king (crowns)
- **📅 Seasonal & Lifetime Rankings** - Compete monthly or see all-time stats
- **🔍 Search & Find Me** - Find yourself or other players in rankings
- **👤 Personal Tab** - View all your captured POIs with king status

### Rankings System
- **City, Country, World** rankings (City first, World last)
- **Seasonal** (monthly) and **Lifetime** views
- **Crown-based** - Ranked by number of POIs where you're king
- **User search** - Find and scroll to specific users
- **Find Me** button - Quickly locate yourself in the rankings

### Map & POIs
- **🗺️ Real POI Data** - Fetches parks, museums, historic sites, churches from OpenStreetMap
- **📍 10km Discovery Radius** - Find POIs within 10km of your location
- **🎨 Custom Icons** - Beautiful POI markers on the map
- **🌙 Dark Mode Maps** - Stunning Mapbox outdoors style
- **📱 POI Drawer** - Tap POIs to see details

### Social & Profile
- **🔐 Authentication** - Secure sign up/login with Supabase
- **👤 User Profiles** - Track your stats, total seconds, and POIs claimed
- **🌍 Multi-language** - English and Nederlands (Dutch) support
- **⚙️ Settings** - Notification preferences and language selection

### Game Balance
- **📉 Daily Decay** - All players lose 10% of their time daily at midnight (keeps locations dynamic)
- **⏰ Daily Cap** - 60 seconds max per POI per day (prevents camping, encourages variety)
- **🎯 Claim Radius** - 220 meters (you're there, not just nearby)

## 📱 Tech Stack

- **Frontend**: React Native + Expo
- **UI Framework**: Tamagui (styled components)
- **Maps**: Mapbox GL + OpenStreetMap (Overpass API)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Location**: Expo Location API
- **Animations**: React Native Reanimated
- **i18n**: react-i18next (English/Nederlands)
- **Routing**: Expo Router
- **Build**: EAS Build
- **CI/CD**: GitHub Actions

## 🛠️ Setup Instructions

### 1. Prerequisites

```bash
# Install Node.js (v18+)
node --version

# Install Expo CLI
npm install -g expo-cli eas-cli
```

### 2. Clone & Install

```bash
git clone https://github.com/pjiepsma/fealty.git
cd fealty
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Get Mapbox Token:** [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)  
**Get Supabase Keys:** Go to your Supabase project → Settings → API

### 4. Set Up Supabase Database

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Run the SQL from `database/schema.sql` in the Supabase SQL Editor
3. Set up the daily decay function:
   - Run `database/decay_function.sql` in Supabase SQL Editor
   - Enable pg_cron extension: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
   - Schedule the decay job: See instructions in `decay_function.sql`

### 5. Run the App

```bash
# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Scan QR code with Expo Go app for physical device
```

## 📊 Database Schema Overview

### Tables

- **users** - User profiles (extends Supabase auth)
- **pois** - Points of Interest (lazy loaded from OSM)
- **claims** - Claim records (user, POI, seconds_earned, month)

### Key Functions

- `nearby_pois(lat, lng, radius)` - Get POIs near location
- `poi_leaderboard(poi_id, month)` - Get leaderboard for POI
- `daily_decay()` - Daily 10% reduction of all seconds_earned (runs at midnight UTC)

## 🎯 Core Philosophy: Against Drive-By Culture

**Fealty is built on the belief that** meaningful exploration requires **actual presence and engagement**. Unlike games that reward quick drive-by visits, Fealty forces players to:

- **Stop and stay** at locations for meaningful time
- **Experience places** rather than just tag them
- **Engage with communities** through physical presence
- **Discover cities deeply** instead of superficially

### Why This Matters
In our fast-paced world, we often drive past amazing places without ever experiencing them. Fealty fights this by making you **literally invest time** in the places you "claim".

## 🎮 Game Mechanics

### Claiming Rules

1. **Entry Duration**: 60 seconds (normal) / 25 seconds (king)
2. **Daily Cap**: 60 seconds per POI (prevents camping, encourages variety)
3. **Claim Radius**: 220 meters (you're there, not just nearby)
4. **Capture Mode**: Up to 60 seconds per session
5. **Minute Bonus**: +10 seconds for completing a full minute

### King Determination

- **King** = User with most seconds at a POI this month
- Updates real-time as claims complete
- Can be overthrown at any moment!
- **King Bonus**: Reduced entry timer (25s vs 60s) with gold visual feedback

### Daily Decay System

- **10% reduction** of all `seconds_earned` daily at midnight UTC
- Keeps locations dynamic
- Prevents inactive players from holding POIs forever
- Everyone loses equally, so active players stay ahead

### Rankings System

- **Crown-based**: Ranked by number of POIs where you're king
- **Scopes**: City, Country, World
- **Time Periods**: Seasonal (monthly) or Lifetime
- **Search**: Find yourself or other players
- **Personal Tab**: View all your captured POIs with king status

### Categories

- 🌳 Parks
- 🎨 Museums
- 🏛️ Historic Sites
- ⛪ Churches
- 🗿 Monuments
- 📍 Other

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only create claims for themselves
- Server-side validation of claim duration
- GPS spoofing protection (location validation)
- Daily limit enforcement

## 🚀 Deployment

### Android (Play Store)

The app uses GitHub Actions for automated builds and Play Store submission:

1. **Workflow**: `.github/workflows/android-internal-build.yml`
2. **Build Profile**: `internal` (for internal testing)
3. **Automatic Submission**: AAB is automatically submitted to Play Store Internal Testing

**Manual Build:**
```bash
# Build for Android
eas build --platform android --profile internal

# Submit to Play Store
eas submit --platform android --profile production
```

### iOS (App Store)

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

## 🎯 Roadmap

### MVP (Current) ✅
- [x] Map with POIs
- [x] Two-phase claiming system (entry + capture)
- [x] King system with reduced entry timer
- [x] Crown-based rankings (City, Country, World)
- [x] Seasonal and Lifetime rankings
- [x] Personal POI overview
- [x] Daily decay system
- [x] Authentication
- [x] User profiles
- [x] Multi-language support (EN/NL)
- [x] POI drawer
- [x] Search in rankings

### Phase 2
- [ ] POI rotation system - Different POIs available each season (month)
- [ ] Push notifications
- [ ] Friends system
- [ ] Challenges
- [ ] Category leaderboards
- [ ] Regional events
- [ ] Achievement system

### Phase 3
- [ ] Premium features
- [ ] Social feed
- [ ] Badges & achievements
- [ ] Business partnerships
- [ ] In-app purchases

## 💡 Tips for Development

### Testing Location

Use Xcode or Android Studio simulator to simulate GPS:

**iOS Simulator:**
- Debug > Location > Custom Location
- Enter coordinates (e.g., Apeldoorn: 52.2115, 5.9699)

**Android Emulator:**
- Extended Controls (three dots)
- Location > enter coordinates

### Debugging

```bash
# View logs
npx expo start
# Press 'j' to open debugger

# Check Supabase
# Go to Supabase dashboard > Table Editor
# View claims, users, pois
```

### Common Issues

**Mapbox not loading:**
- Check your access token in `.env`
- Ensure `app.json` has correct config

**Location not updating:**
- Check permissions in device settings
- iOS: Settings > Fealty > Location
- Android: Settings > Apps > Fealty > Permissions

**Supabase errors:**
- Check RLS policies in dashboard
- Verify API keys are correct
- Check database logs in Supabase

## 📝 License

MIT License - Build something awesome!

## 👥 Contributing

This is a starter template. Feel free to:
- Add new features
- Improve UI/UX
- Fix bugs
- Suggest improvements

## 🎉 Let's Build!

Start the app, claim your first POI, and become King of your city! 👑

For questions or support, check the code comments or Supabase docs.
