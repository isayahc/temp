import { useState } from 'react';
import './App.css';

// ==========================================
// Types
// ==========================================
interface Ingredient {
  name: string;
  amount: string;
}

interface Recipe {
  title: string;
  difficulty: string;
  prep_time_minutes: number;
  calories: number;
  ingredients: Ingredient[];
  instructions: string[];
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface CompanyLocation {
  name: string;
  address: string;
  coordinates: Coordinates;
}

function App() {
  // ==========================================
  // State: Recipe Generator
  // ==========================================
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState('');

  // ==========================================
  // State: Company Locator
  // ==========================================
  const [companyQuery, setCompanyQuery] = useState('');
  const [location, setLocation] = useState<CompanyLocation | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');

  // ==========================================
  // Function 1: Get Recipe (Gemini)
  // ==========================================
  const getRecipe = async () => {
    setRecipeLoading(true);
    setRecipeError('');
    
    try {
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ['chicken', 'rice', 'soy sauce', 'broccoli'],
          dietary_restrictions: 'gluten-free'
        })
      });

      if (!response.ok) throw new Error('Failed to fetch recipe');
      const data = await response.json();
      setRecipe(data);
    } catch (err) {
      console.error(err);
      setRecipeError('Something went wrong generating the recipe.');
    } finally {
      setRecipeLoading(false);
    }
  };

  // ==========================================
  // Function 2: Get Coordinates (Google Maps)
  // ==========================================
  const getCoords = async () => {
    if (!companyQuery) return;
    
    setLocLoading(true);
    setLocError('');
    setLocation(null);

    try {
      const response = await fetch('/api/get-coords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company_name: companyQuery,
          city: '' // Optional: You could add a second input for city
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setLocation(data);
    } catch (err) {
      console.error(err);
      setLocError('Could not find that company.');
    } finally {
      setLocLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>🚀 Isayah's Hackathon Dashboard</h1>
      
      {/* =======================================================
          TOOL 1: CHEF-IT-UP
      ======================================================== */}
      <div className="card" style={{ border: '1px solid #444', padding: '20px', marginBottom: '40px', borderRadius: '12px' }}>
        <h2>👨‍🍳 Chef-It-Up (Gemini AI)</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Generates a recipe based on hardcoded ingredients.</p>
        
        <button onClick={getRecipe} disabled={recipeLoading}>
          {recipeLoading ? 'Cooking...' : '✨ Generate Recipe'}
        </button>

        {recipeError && <p style={{ color: 'red' }}>{recipeError}</p>}

        {recipe && (
          <div className="recipe-card" style={{ textAlign: 'left', background: '#222', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
            <h3 style={{ marginTop: 0 }}>{recipe.title}</h3>
            <p><strong>Calories:</strong> {recipe.calories} | <strong>Time:</strong> {recipe.prep_time_minutes} min</p>
            <h4>Ingredients</h4>
            <ul>
              {recipe.ingredients.map((ing, i) => <li key={i}>{ing.amount} {ing.name}</li>)}
            </ul>
            <h4>Instructions</h4>
            <ol>
              {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
        )}
      </div>

      {/* =======================================================
          TOOL 2: COMPANY LOCATOR
      ======================================================== */}
      <div className="card" style={{ border: '1px solid #444', padding: '20px', borderRadius: '12px' }}>
        <h2>📍 Company Locator (Google Maps)</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Finds the exact coordinates of any business.</p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
          <input 
            type="text" 
            placeholder="e.g. Tesla Gigafactory Texas"
            value={companyQuery}
            onChange={(e) => setCompanyQuery(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #666', width: '60%' }}
          />
          <button onClick={getCoords} disabled={locLoading || !companyQuery}>
            {locLoading ? 'Searching...' : 'Find'}
          </button>
        </div>

        {locError && <p style={{ color: 'red' }}>{locError}</p>}

        {location && (
          <div style={{ textAlign: 'left', background: '#1a2e1a', padding: '20px', borderRadius: '8px', marginTop: '20px', border: '1px solid #2e5c2e' }}>
            <h3 style={{ marginTop: 0, color: '#4ade80' }}>{location.name}</h3>
            <p style={{ fontSize: '1.1rem' }}>{location.address}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <div style={{ background: '#000', padding: '10px', borderRadius: '4px' }}>
                <strong>Latitude:</strong> <br/> {location.coordinates.lat}
              </div>
              <div style={{ background: '#000', padding: '10px', borderRadius: '4px' }}>
                <strong>Longitude:</strong> <br/> {location.coordinates.lng}
              </div>
            </div>
            
            {/* Link to open in real Google Maps */}
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + ' ' + location.address)}`} 
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'inline-block', marginTop: '15px', color: '#4ade80' }}
            >
              Open in Google Maps →
            </a>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;