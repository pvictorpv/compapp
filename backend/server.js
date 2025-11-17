const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Para permitir a comunicação entre frontend e backend
const app = express();
const PORT = 3001;

app.use(cors());

// --- Configuração da Alpha Vantage ---
// ! COLOQUE SUA CHAVE AQUI
const ALPHA_VANTAGE_API_KEY = 'FO827GQFXCRSVQ67'; 
// ! ---------------------------------

/**
 * Função auxiliar que busca os dados fundamentalistas de um ticker na Alpha Vantage.
 * Esta única chamada retorna TANTO o MarketCap QUANTO o SharesOutstanding.
 */
async function getCompanyOverview(tickerWithSuffix) {
    try {
        const response = await axios.get('https://www.alphavantage.co/query', {
            params: {
                function: 'OVERVIEW',
                symbol: tickerWithSuffix,
                apikey: ALPHA_VANTAGE_API_KEY
            }
        });
        
        // Retorna o objeto JSON completo com os dados da empresa
        return response.data;

    } catch (error) {
        console.error(`Erro ao buscar dados para ${tickerWithSuffix}:`, error.message);
        return { 'Error Message': 'Falha ao conectar na API' }; // Retorna um objeto de erro
    }
}

// O endpoint principal que o frontend vai chamar
app.get('/api/compare', async (req, res) => {
    try {
        const { tickerA, tickerB } = req.query; // Ex: tickerA=PETR4, tickerB=MGLU3

        if (!tickerA || !tickerB) {
            return res.status(400).json({ error: 'Tickers A e B são obrigatórios.' });
        }
        
        // Adiciona o sufixo .SA necessário para a B3
        const tickerA_SA = tickerA.toUpperCase() + '.SA';
        const tickerB_SA = tickerB.toUpperCase() + '.SA';

        // 1. Buscar os dados (fazemos duas chamadas, uma para cada empresa)
        const overviewA = await getCompanyOverview(tickerA_SA);
        const overviewB = await getCompanyOverview(tickerB_SA);

        // 2. Verificar se a API retornou erros
        // (A API gratuita tem limite de 5 chamadas por minuto)
        if (overviewA['Error Message'] || overviewB['Error Message']) {
            return res.status(503).json({ error: 'Erro ao buscar dados na API. (Limite de 5 chamadas/minuto atingido?)' });
        }
        
        // 3. Extrair os dados que precisamos
        const sharesA_str = overviewA.SharesOutstanding;
        const marketCapB_str = overviewB.MarketCapitalization;

        // 4. Verificar se os dados existem
        if (!sharesA_str || !marketCapB_str || sharesA_str === "None" || marketCapB_str === "None") {
            return res.status(404).json({ error: 'Dados fundamentalistas não encontrados. Verifique os tickers.' });
        }
        
        // 5. Converter os dados (eles vêm como string) para números
        const sharesA = parseFloat(sharesA_str);
        const marketCapB = parseFloat(marketCapB_str);

        if (sharesA === 0) {
            return res.status(400).json({ error: 'Empresa A não possui ações em circulação.' });
        }

        // 6. Fazer o cálculo!
        const hypotheticalPriceA = marketCapB / sharesA;

        // 7. Enviar o resultado
        res.json({
            tickerA: tickerA.toUpperCase(),
            tickerB: tickerB.toUpperCase(),
            sharesA: sharesA, // O número de ações da Empresa A
            marketCapB: marketCapB, // O valor de mercado da Empresa B
            hypotheticalPriceA: hypotheticalPriceA.toFixed(2) // O preço formatado
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend rodando na porta ${PORT}`);
    console.log(`Certifique-se de que sua API KEY da Alpha Vantage está no server.js`);
});