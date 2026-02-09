from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import mimetypes
import os
import google.generativeai as genai
import googlemaps
from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv
from schemas import Recipe, RecipeRequest, LocationRequest

# Load env variables (Make sure you have python-dotenv installed)
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gmaps = googlemaps.Client(key=os.getenv("MAPS_API_KEY"))

# Define the model (Use 'gemini-1.5-flash' or 'gemini-2.0-flash' for speed)
# model = genai.GenerativeModel('gemini-1.5-flash')
model = genai.GenerativeModel('gemini-2.5-flash')

app = FastAPI()

# 1. Allow the frontend to talk to the backend
origins = [
    "http://localhost:5173",  # Vite's default port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. A simple test route
@app.get("/api/hello")
def read_root():
    return {"message": "Hello from FastAPI + Python!"}



# 1. Mount the "static" folder (the built React app)
# Check if directory exists to avoid errors in dev mode
if os.path.isdir("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

# 2. Catch-all route for the SPA (Single Page Application)
# This ensures that if you refresh the page on /dashboard, it still loads index.html
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if full_path.startswith("api"):
        return {"error": "API route not found"}

    target_file = f"static/{full_path}"
    if os.path.exists(target_file) and os.path.isfile(target_file):
        # === THE FIX STARTS HERE ===
        # Docker 'slim' images often don't know what an SVG is. We must tell them.
        media_type = None
        if full_path.endswith(".svg"):
            media_type = "image/svg+xml"
        
        return FileResponse(target_file, media_type=media_type)
        # === THE FIX ENDS HERE ===
    
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
        
    return {"message": "Frontend not found"}

# --- THE NEW ENDPOINT ---
@app.post("/api/generate-recipe", response_model=Recipe)
async def generate_recipe(request: RecipeRequest):
    # 1. Construct the prompt
    prompt = f"""
    Create a recipe using these ingredients: {', '.join(request.ingredients)}.
    Dietary restrictions: {request.dietary_restrictions}.
    """

    # 2. Call Gemini with STRUCTURED OUTPUT
    # passing 'response_schema' forces it to return JSON matching our class
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=Recipe
        )
    )

    # 3. Parse the JSON text back into a Pydantic object
    # (Gemini returns a string, we convert it to our Recipe object)
    import json
    recipe_data = json.loads(response.text)
    
    return recipe_data


@app.post("/api/get-coords")
def get_company_coordinates(request: LocationRequest):
    # Combine name and city for better accuracy
    search_query = f"{request.company_name} {request.city}".strip()
    
    # 1. Search for the place using "Text Search"
    # This finds places based on a string query (e.g. "OpenAI San Francisco")
    places_result = gmaps.places(query=search_query)
    
    # 2. Check if we found anything
    if not places_result['status'] == 'OK' or not places_result['results']:
        return {"error": "Company not found"}
        
    # 3. Extract the first (most likely) result
    top_result = places_result['results'][0]
    name = top_result['name']
    address = top_result['formatted_address']
    location = top_result['geometry']['location'] # { 'lat': 37.123, 'lng': -122.456 }
    
    return {
        "name": name,
        "address": address,
        "coordinates": location,
        "place_id": top_result['place_id'] # Useful if you want to save it
    }