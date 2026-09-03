from flask import Flask, request, jsonify
from flask_cors import CORS

from predict_utils import predict_complaint


app = Flask(__name__)

CORS(app)


@app.route("/")
def home():
    return {
        "message": "Citizen Complaint Analyzer API Running"
    }



@app.route("/predict", methods=["POST"])
def predict():

    data = request.json

    complaint = data["complaint"]


    result = predict_complaint(complaint)


    return jsonify(result)



if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )