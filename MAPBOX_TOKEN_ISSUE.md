# 🚨 Mapbox Token Dilemma

## ⚠️ **Het Probleem:**

Mapbox dwingt dat tokens met **"Downloads: Read"** automatisch **sk (secret) tokens** worden.

Maar **sk tokens zijn niet veilig voor mobile apps** - die zijn voor servers!

## 📋 **Wat We Nodig Hebben:**

Voor Fealty app kaart laden:
- ✅ **Downloads: Read** = Kaart tiles downloaden
- ✅ **Styles: Read** = Kaart stijlen gebruiken
- ✅ **Fonts: Read** = Lettertypes laden

**Zonder Downloads: Read** = Kaart laadt niet!

## 🤔 **Mogelijke Oplossingen:**

### **Optie 1: SK Token Gebruiken (Niet Aanbevolen)**
```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=sk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJ5b3VyLXRva2VuIn0...
```
- ✅ **Werkt technisch**
- ❌ **Security risico** (secret token in app)
- ❌ **Kan misbruikt worden**
- ❌ **Tegen Mapbox best practices**

### **Optie 2: Mapbox Studio Upload (Aanbevolen)**
1. **Upload je eigen kaart styles** naar Mapbox Studio
2. **Maak custom styles** zonder externe downloads
3. **Gebruik pk token** voor eigen content
- ✅ **Veilig** (pk token)
- ✅ **Mapbox compliant**
- ❌ **Meer werk** om styles te maken

### **Optie 3: Alternatieve Map Provider**
- **MapLibre** (open source, gratis)
- **OpenStreetMap** direct (zonder Mapbox)
- **HERE Maps** (gratis tier)
- **Thunderforest** (betaalbaar)

### **Optie 4: Mapbox Met Restricties**
- Gebruik **pk token** voor basis features
- **Restricties** op token (alleen jouw app)
- Accepteer **lagere kwaliteit** kaarten

## 🎯 **Aanbeveling:**

**Optie 2: Mapbox Studio Upload**

1. **Ga naar [mapbox.com/studio](https://mapbox.com/studio)**
2. **Upload een basic OSM style**
3. **Gebruik pk token** voor je eigen styles
4. **Veilig en compliant**

**Of Optie 3:** **MapLibre** - volledig open source alternatief

## 💰 **Alternatieven Kosten:**
- **MapLibre:** Gratis (open source)
- **HERE Maps:** Gratis tot 250k requests/maand
- **Thunderforest:** €20-50/maand

## 🤔 **Wat Denk Jij?**

**Wil je:**
- SK token gebruiken (werkt maar niet veilig)
- Mapbox Studio proberen
- Alternatieve provider (MapLibre/HERE)
- Andere oplossing?

**Dit is een belangrijke technische beslissing!** 🗺️🔐
