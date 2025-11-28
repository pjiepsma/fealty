# 🗺️ Mapbox Token Oplossing

## ✅ **Bevestigd: PK Token Heeft Geen Downloads: Read**

**Standaard PK token permissions:**
- ✅ **Styles: Read** (kaart stijlen)
- ✅ **Fonts: Read** (lettertypes)
- ✅ **Datasets: Read** (kaart data)
- ✅ **Vision: Read** (visuele features)
- ❌ **Downloads: Read** (kaart tiles downloaden)

**Zonder Downloads: Read** = **Kaart laadt niet in @rnmapbox/maps**

## 🎯 **Definitieve Oplossing: MapLibre**

**MapLibre** is de beste keuze omdat:

### **Voordelen:**
- ✅ **Geen token nodig** (behalve optioneel)
- ✅ **Gratis & open source**
- ✅ **Gebruikt OpenStreetMap data** (zelfde POI's)
- ✅ **Volledig veilig** (geen security risico's)
- ✅ **React Native compatible**
- ✅ **Moderne maps** met vector tiles

### **Implementatie:**
```bash
# Verwijder Mapbox
npm uninstall @rnmapbox/maps

# Installeer MapLibre
npm install @maplibre/maplibre-react-native

# Voor POI fetching blijven we OpenStreetMap gebruiken
# Geen verandering nodig in poi.service.ts
```

### **Code Aanpassing:**
```typescript
// In app/(tabs)/map.tsx
import MapLibreGL from '@maplibre/maplibre-react-native';

// Vervang Mapbox.MapView door:
<MapLibreGL.MapView
  style={styles.map}
  styleURL="https://demotiles.maplibre.org/style.json"
/>
```

## 💰 **Kosten Vergelijking:**

| Provider | Token | Maandelijks | Features |
|----------|-------|-------------|----------|
| Mapbox | PK/SK | €0-50 | Proprietary styles |
| **MapLibre** | **Geen** | **€0** | Open styles |
| HERE Maps | API Key | €0 (250k req) | Professional |

## 🚀 **Waarom MapLibre Perfect Is:**

1. **Geen Security Issues** - geen tokens in app
2. **Dezelfde POI Data** - OpenStreetMap blijft werken
3. **Gratis** - geen kosten
4. **Open Source** - community support
5. **Modern** - vector tiles, smooth performance

## 🎯 **Implementatie Plan:**

1. ✅ **Fealty.app geregistreerd**
2. 🔄 **Switch naar MapLibre** (eenvoudige code change)
3. 🔄 **Rebranding naar Fealty**
4. 🔄 **Claim duur naar 3 minuten**
5. 🔄 **Supabase setup**
6. 🚀 **Launch Fealty app**

**Wil je dat ik de MapLibre implementatie doe?** Het is een snelle switch!

🗺️ **Fealty wordt geweldig met MapLibre!** ⚔️👑
