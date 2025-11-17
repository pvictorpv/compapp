// O arquivo 'src/App.js' do seu projeto React
// (Exatamente o mesmo código de antes)

import React, { useState } from 'react';
import axios from 'axios';

function App() {
    const [tickerA, setTickerA] = useState('');
    const [tickerB, setTickerB] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCompare = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            // 1. Chamar o SEU backend (que agora usa Alpha Vantage)
            const response = await axios.get('http://localhost:3001/api/compare', {
                params: {
                    tickerA: tickerA,
                    tickerB: tickerB
                }
            });
            setResult(response.data);
        } catch (err) {
            // 2. Tratar erros (seja do backend ou da API)
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error); // Mostra o erro vindo do backend
            } else {
                setError('Não foi possível conectar ao servidor.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto' }}>
            <h1>Comparador de Market Cap (Alpha Vantage)</h1>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <label>Se a Empresa A: </label>
                    <input 
                        type="text" 
                        placeholder="Ex: PETR4" 
                        value={tickerA}
                        onChange={(e) => setTickerA(e.target.value)} 
                        style={{ padding: '5px' }}
                    />
                </div>
                <div>
                    <label>tivesse o valor de mercado da Empresa B: </label>
                    <input 
                        type="text" 
                        placeholder="Ex: MGLU3"
                        value={tickerB}
                        onChange={(e) => setTickerB(e.target.value)} 
                        style={{ padding: '5px' }}
                    />
                </div>
            </div>
            
            <button onClick={handleCompare} disabled={loading} style={{ marginTop: '15px', padding: '10px' }}>
                {loading ? 'Calculando...' : 'Calcular'}
            </button>

            {error && <p style={{ color: 'red', marginTop: '15px' }}><strong>Erro:</strong> {error}</p>}

            {result && (
                <div style={{ marginTop: '20px', backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
                    <h2>Resultado:</h2>
                    <p style={{ fontSize: '1.2em' }}>
                        A <strong>{result.tickerA}</strong> teria uma cotação de 
                        <strong> R$ {result.hypotheticalPriceA} </strong> 
                        se tivesse o valor de mercado da <strong>{result.tickerB}</strong>.
                    </p>
                    <hr />
                    <p><strong>Dados usados no cálculo:</strong></p>
                    <p>Número de Ações ({result.tickerA}): {Number(result.sharesA).toLocaleString('pt-BR')}</p>
                    <p>Valor de Mercado ({result.tickerB}): {Number(result.marketCapB).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            )}
        </div>
    );
}

export default App;