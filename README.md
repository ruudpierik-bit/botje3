Een AI-powered chatbot widget voor Elektramat webshop, gebouwd voor Magento 2 / Hyvä.

## Features

- 💬 Chat widget met moderne UI
- 🔄 Service Worker voor background requests (werkt ook na pagina navigatie)
- 🔴 Apple-style notificatie badge
- 📍 Pagina tracking (weet waar de klant is)
- 🛒 Magento cart integratie
- 🔧 Debug mode via URL parameter
- 📱 Responsive design
- ⚡ Webhook URL override voor testen

## Bestanden

| Bestand | Beschrijving | Locatie in Magento |
|---------|--------------|-------------------|
| `botje-widget.html` | Chatbot widget code | CMS Blok of phtml template |
| `botje-sw.js` | Service Worker | `/pub/botje-sw.js` (root) |
| `Botje_2_7_8.html` | Standalone test versie | Alleen voor lokaal testen |

## Installatie in Magento 2

### Stap 1: Service Worker uploaden

Upload `botje-sw.js` naar de **pub** folder van je Magento installatie:

```
/pub/botje-sw.js
```

Via SSH:
```bash
scp botje-sw.js user@server:/var/www/magento/pub/botje-sw.js
```

### Stap 2: Widget toevoegen via CMS Blok

1. Ga naar **Content** → **Blocks** → **Add New Block**
2. Vul in:
   - **Block Title:** Botje Chatbot
   - **Identifier:** botje-chatbot
   - **Store View:** All Store Views
3. Klik op **Show/Hide Editor** (belangrijk!)
4. Plak de volledige inhoud van `botje-widget.html`
5. Klik **Save Block**

### Stap 3: Blok toevoegen aan footer

**Optie A: Via Miscellaneous HTML (makkelijkst)**
1. Ga naar **Content** → **Configuration**
2. Kies je **Store View** → **Edit**
3. Open **Footer** sectie
4. Plak in **Miscellaneous HTML**:
```html
{{block class="Magento\Cms\Block\Block" block_id="botje-chatbot"}}
```
5. **Save Configuration**

**Optie B: Via Widget**
1. Ga naar **Content** → **Widgets** → **Add Widget**
2. Type: CMS Static Block
3. Layout Updates: All Pages, Before Body End
4. Select Block: Botje Chatbot

**Optie C: Via Layout XML**

Maak `app/design/frontend/[Vendor]/[Theme]/Magento_Theme/layout/default.xml`:

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="before.body.end">
            <block class="Magento\Cms\Block\Block" name="botje.chatbot">
                <arguments>
                    <argument name="block_id" xsi:type="string">botje-chatbot</argument>
                </arguments>
            </block>
        </referenceContainer>
    </body>
</page>
```

### Stap 4: Cache legen

```bash
bin/magento cache:flush
```

Of via Admin: **System** → **Cache Management** → **Flush Magento Cache**

## Configuratie

### Webhook URL aanpassen

In `botje-widget.html`, pas de webhook URL aan (bovenaan in de `<script>` sectie):

```javascript
const WEBHOOK_URL_PRODUCTION = 'https://jouw-n8n-url/webhook/xxx';
```

### Service Worker pad aanpassen

Als je de Service Worker niet in de root kunt plaatsen:

```javascript
const SW_PATH = '/media/botje-sw.js';  // Pas aan naar jouw pad
```

## Debug Mode

Activeer debug mode door `?debug=true` toe te voegen aan de URL:

```
https://elektramat.nl/?debug=true
https://elektramat.nl/product/schakelaar?debug=1
```

Debug mode blijft actief tijdens de browser sessie (via sessionStorage).

### Debug Panel Features
- Chat ID en Email weergave
- Login status
- Cart ID (met bron indicator)
- Huidige pagina type
- Webhook status (productie/test)
- Cart ID override
- Webhook URL override
- Laatste request/response data

## Lokaal testen

1. Start een lokale server:
```bash
python -m http.server 8000
```

2. Open in browser:
```
http://localhost:8000/Botje_2_7_8.html?debug=true
```

## Webhook Response Format

De n8n webhook moet JSON retourneren met een van deze structuren:

```json
{
  "answer": "Antwoord tekst"
}
```

of

```json
{
  "output": {
    "answer": "Antwoord tekst"
  }
}
```

of

```json
{
  "message": "Antwoord tekst"
}
```

### Cart reload triggeren

Om de Magento cart te herladen na een webhook response:

```json
{
  "answer": "Product toegevoegd aan je winkelwagen!",
  "reloadCart": true
}
```

## Payload naar Webhook

De chatbot stuurt de volgende data naar de webhook:

```json
{
  "message": "Gebruiker bericht",
  "chatid": "chat_1234567890_abc123",
  "email": "klant@email.nl",
  "magentoCartId": "abc123def456",
  "customerLoggedIn": true,
  "pageInfo": {
    "url": "https://elektramat.nl/product/schakelaar",
    "path": "/product/schakelaar",
    "title": "Schakelaar - Elektramat",
    "pageType": "productpagina",
    "productInfo": {
      "name": "ABB Schakelaar",
      "sku": "ABB-123",
      "price": "€12,95",
      "id": "12345",
      "stock": "Op voorraad"
    },
    "categoryInfo": {
      "name": "Schakelmateriaal",
      "breadcrumbs": ["Home", "Schakelmateriaal", "Schakelaars"]
    },
    "searchQuery": null
  }
}
```

### Page Types

De `pageType` kan zijn:
- `homepage`
- `productpagina`
- `categorie`
- `winkelwagen`
- `checkout`
- `zoekresultaten`
- `login`
- `registratie`
- `account`
- `verlanglijst`
- `bestellingen`
- `contact`
- `overig`

## Changelog

### v2.7.8
- 🔴 Apple-style rode notificatie badge

### v2.7.7
- 🔔 Fix: Badge notificatie bij gesloten chat
- 💬 Chat button verschijnt weer bij nieuw bericht

### v2.7.6
- 🐛 Debug panel toont nu Service Worker responses

### v2.7.5
- 🐛 Debug mode via URL parameter (?debug=true)
- 📋 Dynamisch versienummer in menu

### v2.7.4
- 📐 Chat wordt groter wanneer geopend (720px)
- 💬 Chat button verdwijnt bij openen

### v2.7.3
- 💬 Chat button verbergen bij open chat

### v2.7.2
- 📜 Slimme scroll logica bij nieuwe berichten

### v2.7.1
- 🔔 Badge blijft na page reload (localStorage)

### v2.7.0
- 🔄 Service Worker voor background requests
- ⏳ Pending indicator
- 🔔 Notificatie badge systeem

### v2.6.0
- 🔧 Webhook URL override voor testen
- ⚠️ Test mode banner
- 📋 Versie info in hamburger menu

### v2.5.0
- 📍 Pagina tracking
- 🔍 Product/categorie/zoek detectie

### v2.4.0
- 💾 Chat persistence (localStorage)
- 🔐 Login detectie

## Troubleshooting

### Chat verschijnt niet
1. Check browser console voor errors (F12)
2. Controleer of CMS blok actief is
3. Flush Magento cache

### Service Worker werkt niet
1. Moet op HTTPS draaien (of localhost)
2. Check of `botje-sw.js` in `/pub/` staat
3. Check browser console voor SW errors

### Badge verschijnt niet
1. Controleer localStorage in DevTools
2. Check of `elektramat_chat_badge` key bestaat

### Debug panel verschijnt niet
1. Voeg `?debug=true` toe aan URL
2. Check sessionStorage voor `elektramat_debug_mode`

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11.1+
- Edge 79+
