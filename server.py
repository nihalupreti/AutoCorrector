from flask import Flask, jsonify, request
from flask_cors import CORS
from transformers import T5ForConditionalGeneration, T5Tokenizer

MODEL_DIR = "E:/AutoCorrection/final_model"
model = T5ForConditionalGeneration.from_pretrained(MODEL_DIR)
tokenizer = T5Tokenizer.from_pretrained(MODEL_DIR)

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def home():
    return "Server is Up and Running."


@app.route('/correct', methods=['POST'])
def correct():
    try:
        data = request.get_json()
        text = data.get("text", "")

        inputs = tokenizer(text, return_tensors="pt")
        outputs = model.generate(inputs.input_ids)
        decoded_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(decoded_output)
        # Compare original & corrected text
        incorrect_words = find_incorrect_words(text, decoded_output)

        return jsonify({"corrected_text": decoded_output, "incorrect_words": incorrect_words})

    except Exception as e:
        return jsonify({"error": str(e)})


def find_incorrect_words(original, corrected):
    """Find words that changed between original and corrected text."""
    original_words = original.split()
    corrected_words = corrected.split()

    incorrect = []
    for i, word in enumerate(original_words):
        if i >= len(corrected_words) or word != corrected_words[i]:
            incorrect.append(word)

    return incorrect


if __name__ == '__main__':
    app.run(debug=True)
