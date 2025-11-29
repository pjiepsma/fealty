# ⚔️ Fealty - Territory Claiming Game

**Show Fealty to Become King**

A location-based mobile game where players claim physical Points of Interest by **actually being present**. No quick drive-bys, but real visits with genuine dedication. Show loyalty to your territory, become King, and dominate your city!

## 🎮 Core Game Mechanic

### Entry Mode (10 seconds)
Walk into a POI's radius → **Yellow progress arc** appears → Complete 10 seconds

### Capture Mode (up to 60 seconds)
Timer starts counting → Earn 1 second per second → **Bonus: +10 seconds for completing a full minute!**

**Leave the radius?** Your captured time is saved for the leaderboard!

## 🚀 Features

- **🎯 Two-Phase Capture System** - Entry mode (10s) → Capture mode (60s max)
- **⏱️ Real-time Timer** - Watch your captured seconds grow
- **🎁 Minute Bonus** - Complete 60 seconds for +10 bonus seconds!
- **🗺️ Real POI Data** - Fetches castles, windmills, museums, parks from OpenStreetMap
- **📍 10km Discovery Radius** - Find POIs within 10km of your location
- **🎨 Custom Polygon Icons** - Beautiful castle, windmill, and other icons
- **🌙 Dark Mode Maps** - Stunning Mapbox styling
- **🔐 Authentication** - Secure sign up/login with Supabase
- **👤 User Profiles** - Track your stats and achievements

## 📱 Tech Stack

- **Frontend**: React Native + Expo
- **Maps**: Mapbox GL + OpenStreetMap (Overpass API)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Location**: Expo Location API
- **Animations**: React Native Reanimated
- **Authentication**: Supabase Auth

## 🛠️ Setup Instructions

### 1. Prerequisites

```bash
# Install Node.js (v18+)
node --version

# Install Expo CLI
npm install -g expo-cli
```

### 2. Clone & Install

```bash
git clone https://github.com/pjiepsma/fealty.git
cd fealty
npm install
```

### 3. Configure Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Get Mapbox Token:** [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
**Get Supabase Keys:** See `AUTHENTICATION_SETUP.md` for detailed instructions

### 4. Set Up Supabase Database

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Run the SQL from `database/schema.sql` in the Supabase SQL Editor
3. Follow the complete guide in `AUTHENTICATION_SETUP.md`

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
```

### 3. Get API Keys

#### Mapbox Token
1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Create account / Login
3. Create a new access token
4. Copy the token

#### Supabase Setup
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create new project
3. Wait for database to provision
4. Go to Settings > API
5. Copy `URL` and `anon public` key
6. Go to SQL Editor
7. Copy and run the entire database schema from the artifacts

### 4. Configure Environment

Create `.env` file in project root:

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJ5b3VyLXRva2VuIn0...
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Project Structure

Copy all the TypeScript files from the artifacts into your project:

```
dictaat-app/
├── app/
│   ├── _layout.tsx              # Root layout with AuthProvider
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation
│   │   ├── map.tsx              # Main map screen ⭐
│   │   ├── rankings.tsx         # Leaderboards
│   │   └── profile.tsx          # User profile
│   └── auth/
│       ├── login.tsx            # Login screen
│       └── signup.tsx           # Sign up screen
├── components/
│   └── (custom components)
├── services/
│   ├── supabase.ts              # Supabase client
│   ├── poi.service.ts           # POI fetching & management
│   └── claim.service.ts         # Claim logic
├── hooks/
│   └── useAuth.tsx              # Authentication hook
├── types/
│   └── index.ts                 # TypeScript types
├── utils/
│   ├── distance.ts              # Geo calculations
│   └── date.ts                  # Date utilities
├── constants/
│   └── config.ts                # App constants
├── .env                         # Environment variables
├── app.json                     # Expo config
└── package.json
```

### 6. Run the App

```bash
# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on physical device
# Scan QR code with Expo Go app
```

## 📊 Database Schema Overview

### Tables

- **users** - User profiles (extends Supabase auth)
- **pois** - Points of Interest (lazy loaded from OSM)
- **claims** - Claim records (user, POI, minutes, month)
- **active_sessions** - Current active claims
- **user_stats** - Cached user statistics
- **monthly_leaderboard** - Monthly rankings (materialized)

### Key Functions

- `nearby_pois(lat, lng, radius)` - Get POIs near location
- `poi_leaderboard(poi_id, month)` - Get leaderboard for POI
- `update_user_stats(user_id)` - Update user statistics

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

1. **Minimum Duration**: 5 minutes (forces meaningful visits)
2. **Daily Cap**: 60 minutes per POI (prevents camping, encourages variety)
3. **Claim Radius**: 50 meters (you're there, not just nearby)
4. **Location Updates**: Every 30 seconds (ensures continuous presence)
5. **Session Ping**: Every 30 seconds (prevents GPS spoofing)

### King Determination

- King = User with most minutes at a POI this month
- Updates real-time as claims complete
- Can be overthrown at any moment!

### Categories

- 🌳 Parks
- 🍔 Restaurants
- 🎨 Museums
- 🏛️ Historic Sites
- ⛪ Churches
- ⭐ Tourist Attractions
- 📍 Other

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only create claims for themselves
- Server-side validation of claim duration
- GPS spoofing protection (last_ping validation)
- Daily limit enforcement

## 🚀 Deployment

### iOS

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

## 🎯 Roadmap

### MVP (Current)
- [x] Map with POIs
- [x] Basic claiming
- [x] Leaderboards per POI
- [x] Authentication
- [x] User profiles

### Phase 2
- [ ] Push notifications
- [ ] Friends system
- [ ] Challenges
- [ ] Category leaderboards
- [ ] City/Region leaderboards

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
# View claims, users, sessions
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
