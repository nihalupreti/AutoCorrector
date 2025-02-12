from flask import Flask, jsonify, request
from flask_cors import CORS
from transformers import T5ForConditionalGeneration, T5Tokenizer
from textblob import TextBlob
import nltk
from nltk.corpus import words

# Ensure nltk data is available
nltk.download('words')

MODEL_DIR = "E:/AutoCorrection/final_model"
model = T5ForConditionalGeneration.from_pretrained(MODEL_DIR)
tokenizer = T5Tokenizer.from_pretrained(MODEL_DIR)

app = Flask(__name__)
CORS(app)

# Word list from nltk corpus (valid words)
valid_words = set(words.words())


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
        print(f"Corrected text: {decoded_output}")

        # Find incorrect words
        incorrect_words = find_incorrect_words(decoded_output)

        return jsonify({"corrected_text": decoded_output, "incorrect_words": incorrect_words})

    except Exception as e:
        return jsonify({"error": str(e)})


def find_incorrect_words(suggested_sen):
    corrected_words = suggested_sen.split()
    incorrect = []

    for word in corrected_words:
        if word.lower() not in valid_words:  # If the word is not in the dictionary
            corrected_word = correct_spelling(word)
            print(correct_spelling(word))
            if corrected_word != word:
                incorrect.append(corrected_word)

    return incorrect


def correct_spelling(word):
    blob = TextBlob(word)
    return str(blob.correct())


if __name__ == '__main__':
    app.run(debug=True)
