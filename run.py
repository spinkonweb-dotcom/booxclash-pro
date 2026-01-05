import uvicorn

if __name__ == "__main__":
    # Note: We point to "main:app" instead of "app.main:app"
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True
    )