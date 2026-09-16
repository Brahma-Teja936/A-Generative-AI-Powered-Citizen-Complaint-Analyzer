import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app import create_app
from backend.config import Config

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = Config.DEBUG
    print(f"Starting CivicAI API Server on http://0.0.0.0:{port} (Debug={debug})")
    app.run(host="0.0.0.0", port=port, debug=debug)
