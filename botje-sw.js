/**
 * Botje Service Worker v2.7
 * Handelt chat requests af op de achtergrond, zelfs bij pagina navigatie
 */

const SW_VERSION = '2.7';
const REQUEST_TIMEOUT = 120000; // 2 minuten timeout

console.log('🤖 Botje Service Worker geladen - versie ' + SW_VERSION);

// Luister naar berichten van de main thread
self.addEventListener('message', async function(event) {
    const { type, payload, requestId } = event.data;
    
    if (type === 'CHAT_REQUEST') {
        console.log('📨 SW: Chat request ontvangen', requestId);
        
        try {
            // Sla op dat we bezig zijn met een request
            await saveToCache('pending_request', {
                requestId: requestId,
                payload: payload,
                timestamp: Date.now(),
                status: 'pending'
            });
            
            // Voer de request uit met timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
            
            const response = await fetch(payload.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload.data),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            
            const data = await response.json();
            console.log('✅ SW: Response ontvangen', data);
            
            // Sla response op
            await saveToCache('pending_response', {
                requestId: requestId,
                response: data,
                timestamp: Date.now(),
                status: 'completed',
                read: false
            });
            
            // Verwijder pending request
            await deleteFromCache('pending_request');
            
            // Probeer de main thread te notificeren
            notifyClients({
                type: 'CHAT_RESPONSE',
                requestId: requestId,
                response: data,
                status: 'completed'
            });
            
        } catch (error) {
            console.error('❌ SW: Request failed', error.message);
            
            // Sla error op
            await saveToCache('pending_response', {
                requestId: requestId,
                error: error.message,
                timestamp: Date.now(),
                status: 'error',
                read: false
            });
            
            // Verwijder pending request
            await deleteFromCache('pending_request');
            
            // Notificeer clients
            notifyClients({
                type: 'CHAT_RESPONSE',
                requestId: requestId,
                error: error.message,
                status: 'error'
            });
        }
    }
    
    if (type === 'CHECK_PENDING') {
        // Check of er een pending response is
        const pendingResponse = await getFromCache('pending_response');
        const pendingRequest = await getFromCache('pending_request');
        
        event.source.postMessage({
            type: 'PENDING_STATUS',
            pendingResponse: pendingResponse,
            pendingRequest: pendingRequest
        });
    }
    
    if (type === 'MARK_READ') {
        // Markeer response als gelezen
        const pendingResponse = await getFromCache('pending_response');
        if (pendingResponse && pendingResponse.requestId === event.data.requestId) {
            pendingResponse.read = true;
            await saveToCache('pending_response', pendingResponse);
        }
    }
    
    if (type === 'CLEAR_PENDING') {
        // Wis alle pending data
        await deleteFromCache('pending_request');
        await deleteFromCache('pending_response');
        console.log('🧹 SW: Pending data gewist');
    }
});

// Helper functies voor IndexedDB-achtige opslag via Cache API
async function saveToCache(key, data) {
    try {
        const cache = await caches.open('botje-data');
        const response = new Response(JSON.stringify(data));
        await cache.put('/' + key, response);
    } catch (e) {
        console.warn('SW: Cache save failed', e);
    }
}

async function getFromCache(key) {
    try {
        const cache = await caches.open('botje-data');
        const response = await cache.match('/' + key);
        if (response) {
            return await response.json();
        }
    } catch (e) {
        console.warn('SW: Cache get failed', e);
    }
    return null;
}

async function deleteFromCache(key) {
    try {
        const cache = await caches.open('botje-data');
        await cache.delete('/' + key);
    } catch (e) {
        console.warn('SW: Cache delete failed', e);
    }
}

// Notificeer alle open tabs/windows
async function notifyClients(message) {
    const clients = await self.clients.matchAll({ type: 'window' });
    console.log('📢 SW: Notificeer', clients.length, 'clients');
    
    clients.forEach(client => {
        client.postMessage(message);
    });
}

// Service Worker lifecycle events
self.addEventListener('install', function(event) {
    console.log('🔧 SW: Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('✅ SW: Activated');
    event.waitUntil(self.clients.claim());
});
