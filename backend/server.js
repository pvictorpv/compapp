const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());

// --- Configuração da Brapi.dev ---
const BRAPI_API_KEY = 'xvTQ6xPjwLqwP713uSrsB3'; // SUA CHAVE AQUI
const BRAPI_BASE_URL = 'https://brapi.dev/api';

/**
 * Endpoint 1: Rota de Busca (Simplificada)
 * Não envia mais logo ou website
 */
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) return res.json([]); 

    try {
        const response = await axios.get(`${BRAPI_BASE_URL}/quote/list`, {
            params: { search: query, limit: 15, token: BRAPI_API_KEY }
        });
        
        // Simplificado: Apenas valor e rótulo
        const suggestions = response.data.stocks.map(stock => ({
            value: stock.stock, 
            label: `${stock.name} (${stock.stock})` // Ex: "Petrobras (PETR4)"
        }));
        res.json(suggestions);

    } catch (error) {
        console.error("Erro na busca:", error.message);
        res.status(500).json({ error: 'Erro ao buscar sugestões.' });
    }
});


/**
 * Helper: Busca dados da Brapi
 */
async function getBrapiQuote(ticker) {
    try {
        const response = await axios.get(`${BRAPI_BASE_URL}/quote/${ticker}`, {
            params: { token: BRAPI_API_KEY }
        });
        if (response.data && response.data.results && response.data.results.length > 0) {
            return response.data.results[0]; 
        }
        return { error: 'Ticker não encontrado na Brapi' };
    } catch (error) {
        return { error: 'Falha ao conectar na Brapi' };
    }
}


/**
 * Endpoint 2: Rota de Comparação (Simplificada)
 * Revertido para lógica Brapi e sem logos/website
 */
app.get('/api/compare', async (req, res) => {
    try {
        const { tickerA, tickerB } = req.query; 

        if (!tickerA || !tickerB) {
            return res.status(400).json({ error: 'Tickers A e B são obrigatórios.' });
        }
        
        const dataA = await getBrapiQuote(tickerA.toUpperCase());
        const dataB = await getBrapiQuote(tickerB.toUpperCase());

        if (dataA.error) return res.status(404).json({ error: dataA.error });
        if (dataB.error) return res.status(404).json({ error: dataB.error });

        const marketCapA = dataA.marketCap;
        const priceA = dataA.regularMarketPrice;
        const marketCapB = dataB.marketCap;

        if (!marketCapA || !priceA || !marketCapB) {
            return res.status(404).json({ 
                error: 'Dados incompletos (MarketCap ou Preço) não encontrados na Brapi.' 
            });
        }
        
        if (priceA === 0) {
            return res.status(400).json({ error: 'Preço da Empresa A é zero.' });
        }

        const sharesA = marketCapA / priceA;
        const hypotheticalPriceA = marketCapB / sharesA;

        // --- RESPOSTA SIMPLIFICADA (SEM LOGOS/WEBSITE) ---
        res.json({
            tickerA: dataA.symbol,
            tickerB: dataB.symbol,
            longNameA: dataA.longName || dataA.shortName,
            longNameB: dataB.longName || dataB.shortName,
            hypotheticalPriceA: hypotheticalPriceA.toFixed(2),
            currentPriceA: dataA.regularMarketPrice,
            currentPriceB: dataB.regularMarketPrice
            // Campos de logo e website foram removidos
        });

    } catch (error) {
        console.error("Erro no /api/compare:", error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend rodando na porta ${PORT}`);
    console.log(`>>> Servidor (Brapi-Only, SEM LOGOS) iniciado <<<`);
});