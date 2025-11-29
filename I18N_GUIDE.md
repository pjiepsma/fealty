# i18n Implementation Guide

## 🌍 **Internationalization (i18n) Setup**

Fealty now supports multiple languages using `i18next` and `react-i18next`.

---

## 📁 **File Structure**

```
fealty/
├── i18n.ts                      # i18n configuration
├── locales/
│   ├── en.json                  # English translations
│   └── nl.json                  # Dutch translations
└── components/
    └── LanguageSwitcher.tsx     # Language switcher component
```

---

## 🎯 **Current Languages**

- 🇬🇧 **English** (en) - Default/Fallback
- 🇳🇱 **Nederlands** (nl) - Dutch

---

## 🚀 **How to Use Translations**

### **1. Import the hook:**

```typescript
import { useTranslation } from 'react-i18next';
```

### **2. Use in your component:**

```typescript
export default function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('auth.login.title')}</Text>
  );
}
```

### **3. With variables (interpolation):**

```typescript
<Text>{t('game.rewards.minuteBonus', { seconds: 10 })}</Text>
// Output: "Minute Bonus! +10 seconds"
```

---

## 📝 **Adding New Translations**

### **Step 1: Add to `locales/en.json`**

```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is a description"
  }
}
```

### **Step 2: Add to `locales/nl.json`**

```json
{
  "myFeature": {
    "title": "Mijn Functie",
    "description": "Dit is een beschrijving"
  }
}
```

### **Step 3: Use in your component**

```typescript
<Text>{t('myFeature.title')}</Text>
```

---

## 🔄 **Adding a New Language**

### **1. Create translation file:**

Create `locales/de.json` (for German):

```json
{
  "common": {
    "loading": "Laden...",
    "error": "Fehler"
  },
  // ... copy structure from en.json
}
```

### **2. Update `i18n.ts`:**

```typescript
import de from './locales/de.json';

i18n.init({
  resources: {
    en: { translation: en },
    nl: { translation: nl },
    de: { translation: de }, // Add new language
  },
  // ...
});
```

### **3. Update `LanguageSwitcher.tsx`:**

```typescript
const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' }, // Add new language
];
```

---

## 🎨 **Language Switcher**

The `LanguageSwitcher` component is available in the Profile screen. Users can switch between languages by tapping on the language buttons.

To add it to another screen:

```typescript
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// In your component:
<LanguageSwitcher />
```

---

## 🔍 **How Language Detection Works**

1. **Device Language:** The app automatically detects the user's device language
2. **Fallback:** If the device language isn't supported, it falls back to English
3. **Manual Switch:** Users can manually change the language in the Profile screen
4. **Persistence:** The selected language is remembered (automatically by i18next)

---

## 📋 **Translation Keys Structure**

```
common.*           - Common words (loading, error, cancel, etc.)
auth.login.*       - Login screen
auth.signup.*      - Sign up screen
map.*              - Map screen
profile.*          - Profile screen
rankings.*         - Rankings screen
poi.types.*        - POI type names
game.rewards.*     - Game reward messages
```

---

## ✅ **What's Already Translated**

- ✅ Login screen
- ✅ Sign up screen
- ✅ Profile screen
- ✅ Common error messages
- ✅ POI types
- ✅ Game reward messages

## 📝 **To Do**

- [ ] Translate map screen texts
- [ ] Translate rankings screen
- [ ] Add more languages (German, French, etc.)
- [ ] Translate error messages from Supabase
- [ ] Add date/time formatting for different locales

---

## 🛠️ **Testing Different Languages**

### **Method 1: Language Switcher**
Go to Profile → Tap language button

### **Method 2: Change Device Language**
Change your phone's system language, restart the app

### **Method 3: Force Language (for testing)**

In `i18n.ts`, change:

```typescript
lng: 'nl', // Force Dutch
// instead of:
lng: deviceLanguage,
```

---

## 🌟 **Best Practices**

1. **Always provide fallback:** English should have all keys
2. **Use nested keys:** Group related translations
3. **Keep keys semantic:** Use descriptive names, not UI positions
4. **Test with longest language:** Some languages are longer (German, Dutch)
5. **Use interpolation:** For dynamic content like usernames, numbers

---

## 📚 **Resources**

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [expo-localization](https://docs.expo.dev/versions/latest/sdk/localization/)

---

**Your app now speaks multiple languages! 🌍🎉**

