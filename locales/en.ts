/**
 * English translations - This is the source of truth
 * All keys must be present here
 * The type is inferred from this object
 */
const en = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    save: 'Save',
  },
  auth: {
    login: {
      title: 'Welcome to Fealty',
      subtitle: 'Prove your loyalty, earn your crown 👑',
      email: 'Email',
      password: 'Password',
      loginButton: 'Login',
      loggingIn: 'Logging in...',
      noAccount: "Don't have an account?",
      signUp: 'Sign Up',
      errors: {
        fillAllFields: 'Please fill in all fields',
        loginFailed: 'Login Failed',
        invalidCredentials: 'Invalid email or password',
        networkError: 'Network error. Please check your connection and try again.',
      },
    },
    signup: {
      title: 'Join Fealty',
      subtitle: 'Start your journey of loyalty',
      username: 'Username',
      email: 'Email',
      password: 'Password (min 6 characters)',
      signupButton: 'Sign Up',
      creatingAccount: 'Creating account...',
      hasAccount: 'Already have an account?',
      login: 'Login',
      success: {
        title: 'Success',
        message: 'Account created! Please check your email to verify.',
        ok: 'OK',
      },
      errors: {
        fillAllFields: 'Please fill in all fields',
        passwordTooShort: 'Password must be at least 6 characters',
        signupFailed: 'Sign Up Failed',
        userExists: 'This email is already registered. Please login instead.',
        usernameExists: 'This username is already taken. Please choose another.',
        invalidEmail: 'Please enter a valid email address',
        networkError: 'Network error. Please check your connection and try again.',
      },
    },
  },
  map: {
    title: 'Map',
    entryMode: 'Entry Mode',
    captureMode: 'Capture Mode',
    insideRadius: 'Inside Radius',
    outsideRadius: 'Outside Radius',
    distance: 'Distance',
    loading: 'Loading POIs...',
    noLocation: 'Waiting for location...',
    timer: {
      capturing: 'Capturing...',
      completed: 'Capture Complete!',
    },
  },
  profile: {
    title: 'Profile',
    signOut: 'Sign Out',
    confirmSignOut: {
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      cancel: 'Cancel',
      confirm: 'Sign Out',
    },
    stats: {
      minutesCaptured: 'Minutes Captured',
      poisClaimed: 'POIs Claimed',
      currentlyKingOf: 'Currently King Of',
    },
    errors: {
      signOutFailed: 'Error',
    },
    menu: {
      account: 'Account',
      editProfile: 'Edit Profile',
      notifications: 'Notification Center',
      notificationSettings: 'Notification Settings',
      preferences: 'Preferences',
      support: 'Support & Info',
      rulesHelp: 'Rules & Help',
      contact: 'Contact Support',
      language: 'Language',
    },
    edit: {
      username: 'Username',
      email: 'Email',
      password: 'Password',
      usernamePlaceholder: 'Enter username',
      emailHint: 'Email cannot be changed',
      changeAvatar: 'Tap to change avatar',
      changePassword: {
        button: 'Change Password',
        title: 'Change Password',
        description: "We'll send you an email with instructions to reset your password.",
        send: 'Send Email',
        emailSent: 'Password reset email sent! Check your inbox.',
      },
      account: {
        title: 'Account Information',
        memberSince: 'Member Since',
        accountType: 'Account Type',
        premium: 'Premium',
        free: 'Free',
      },
      location: {
        title: 'Home Location',
        country: 'Country',
        city: 'Home City',
        countryHint: 'Used for country leaderboards and local rankings',
        cityHint: 'Your city determines your local leaderboard',
        selectCountry: 'Select Country',
        selectCity: 'Select City',
        autoDetect: 'Auto-Detect from GPS',
        searchCountry: 'Search countries...',
        searchCity: 'Search cities...',
        playerCount_one: '{{count}} player',
        playerCount_other: '{{count}} players',
        players: 'players',
        popularCities: 'Popular cities in {{country}}',
        searchResults: 'Search results',
        noCitiesFound: 'No cities found. Try a different search.',
        locationUpdated: 'Location updated successfully!',
        updateLimit: 'You can only change your location {{times}} times per week',
        autoDetectFailed: 'Could not detect your location. Please enable location services.',
      },
      dangerZone: {
        title: 'Danger Zone',
        deleteAccount: {
          button: 'Delete Account',
          title: 'Delete Account?',
          description: 'This action cannot be undone. All your data will be permanently deleted.',
          confirm: 'Delete',
        },
      },
      success: 'Profile updated successfully!',
      errors: {
        usernameRequired: 'Username is required',
      },
    },
    settings: {
      notifications: {
        saved: 'Notification settings saved!',
        sections: {
          game: 'Game Notifications',
          social: 'Social',
          reminders: 'Reminders',
        },
        poiNearby: {
          title: 'POI Nearby',
          description: "Get notified when you're near a capturable POI",
        },
        captureComplete: {
          title: 'Capture Complete',
          description: 'Notify when you complete a capture session',
        },
        kingStatus: {
          title: 'King Status Changed',
          description: 'Alert when you become or lose King status',
        },
        newChallenge: {
          title: 'New Challenges',
          description: 'Notify about new challenges and events',
        },
        friendActivity: {
          title: 'Friend Activity',
          description: "Updates about your friends' achievements",
        },
        leaderboard: {
          title: 'Leaderboard Updates',
          description: 'Notify when your ranking changes',
        },
        dailyReminder: {
          title: 'Daily Reminder',
          description: 'Daily reminder to explore and capture',
        },
        weeklyReport: {
          title: 'Weekly Report',
          description: 'Weekly summary of your achievements',
        },
      },
      general: {
        language: 'Language',
      },
    },
  },
  rankings: {
    title: 'Rankings',
    comingSoon: 'Coming soon...',
    leaderboard: 'Leaderboard',
    rank: 'Rank',
    player: 'Player',
    minutes: 'Minutes',
    pois: 'POIs',
    tabs: {
      world: 'World',
      country: 'Country',
      city: 'City',
      personal: 'Personal',
    },
    timePeriod: {
      seasonal: 'Seasonal',
      lifetime: 'Lifetime',
    },
    sortBy: {
      minutes: 'Minutes',
      crowns: 'Crowns',
    },
    findMe: 'Find Me',
    searchPlaceholder: 'Search by username...',
    noData: 'No Rankings Yet',
    noDataHint: 'Start capturing POIs to appear on the leaderboard!',
    setCountryFirst: 'Set Your Country',
    setCountryHint: 'Go to Profile → Edit Profile to set your home country',
    setCityFirst: 'Set Your City',
    setCityHint: 'Go to Profile → Edit Profile to set your home city',
    noClaims: 'No POIs captured yet',
  },
  poi: {
    types: {
      park: 'Park',
      museum: 'Museum',
      historic: 'Historic',
      church: 'Church',
      monument: 'Monument',
      castle: 'Castle',
      windmill: 'Windmill',
      other: 'Other',
    },
  },
  game: {
    rewards: {
      minuteBonus: 'Minute Bonus! +{{seconds}} seconds',
      sessionEnded: 'Session ended: +{{seconds}}s',
      totalCaptured: 'Total captured: {{seconds}}s',
    },
  },
  notifications: {
    title: 'Notifications',
    unread: '{{count}} unread',
    markAllRead: 'Mark all read',
    clearAll: 'Clear all',
    empty: {
      title: 'No Notifications',
      message: "You're all caught up! New notifications will appear here.",
    },
    types: {
      poiNearby: 'POI Nearby',
      captureComplete: 'Capture Complete',
      kingStatus: 'King Status',
      challenge: 'New Challenge',
      friend: 'Friend Activity',
      leaderboard: 'Leaderboard',
    },
    messages: {
      poiNearby: '{{name}} is within reach! Start capturing now.',
      captureComplete: 'You earned {{minutes}} minutes! Well done!',
      becameKing: "👑 You're now the King of {{name}}!",
      lostKing: 'You lost King status at {{name}}',
      leaderboardRank: "You're now rank #{{rank}} on the leaderboard!",
    },
    time: {
      justNow: 'Just now',
      minutesAgo: '{{count}}m ago',
      hoursAgo: '{{count}}h ago',
      daysAgo: '{{count}}d ago',
    },
  },
  rules: {
    title: 'Rules & Help',
    subtitle: 'Learn how to play and become the King',
    quickStats: {
      entryTime: 'Entry Time',
      maxCapture: 'Max Capture',
      bonus: 'Minute Bonus',
    },
    sections: {
      howToPlay: {
        title: 'How to Play',
        content:
          'Fealty is a location-based game where you prove your loyalty to places by spending time there. Find POIs on the map, walk into their radius, and start capturing to earn rewards and become the King!',
      },
      captureMode: {
        title: 'Capture Mode',
        content:
          "When you enter a POI's radius, you'll see a yellow progress bar for 10 seconds (Entry Mode). After that, the timer starts and you can capture up to 60 seconds. The longer you stay, the more you earn!",
      },
      rewards: {
        title: 'Rewards & Bonuses',
        content:
          'You earn 1 second for every second you capture. Complete a full minute (60 seconds) to get a +10 second bonus! Your total captured time goes toward the leaderboard and King status.',
      },
      kingStatus: {
        title: 'King Status',
        content:
          'The player with the most captured time at a POI becomes its King! 👑 You can be King of multiple POIs at once. Keep visiting to defend your crown or challenge others for theirs!',
      },
      pois: {
        title: 'Points of Interest',
        content:
          'POIs include castles, museums, parks, churches, and monuments. Each has a 37.6m radius. Explore your city to find new POIs and add them to your collection!',
      },
      community: {
        title: 'Community & Fair Play',
        content:
          "Play fair, respect other players, and enjoy exploring your city. Don't use GPS spoofing or cheating tools. Report any issues to our support team.",
      },
    },
    tips: {
      title: 'Pro Tips',
      tip1: 'Visit during off-peak hours to maximize your chances of becoming King',
      tip2: 'Complete the full minute to get the +10 second bonus',
      tip3: 'Check the leaderboard regularly to track your progress',
    },
    support: {
      title: 'Need Help?',
      description: 'If you have questions or encounter issues, our support team is here to help.',
      contact: 'Contact Support',
    },
  },
};

// Export the type inferred from English translations
export type TranslationKeys = typeof en;

// Helper type to generate dot-notation paths from nested object
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationKeys>;

export default en;

