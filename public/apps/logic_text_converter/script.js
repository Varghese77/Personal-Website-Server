/**
 @author Roy Varghese Mathew
 October 16th 2016

 This script provides the main functionality for the logic text converter app. This app
 provides an easy method for people to type logical symbols (such as those related to
 propositional logic, predicate logic, set logic, ect.) that are generally not available on
 English keyboards. The user will input raw text into the app's textbox and the app will
 convert certain patterns of characters into logical symbols. The conversion key can be found
 in readme.html
 */

// InputText Object that stores the edit history of the app's textbox and provides its main
// translation of revision functionality.
var textBox;
window.onload = function () {
    textBox = new InputText();
}

/**
 * TextStack is a a specialized implementation of a stack (a data structor that follows the
 * first in, first out data retrieval) that returns "" rather than an error when the pop or
 * peek functions are called on an empty TextStack. Stack should only store strings.
 *
 * @constructor
 * @this {TextStack}
 */
function TextStack() {

    /** @private */ var stack = [];

    /**
     * Removes and returns the the string at the top of this TextStack or "" if this TextStack
     * is empty.
     *
     * @this {TextStack}
     * @modifies Deletes the string at the top of this TextStack
     * @returns {String} String at the top of the TextStack
     */
    this.pop = function () {
        if (!this.isEmpty()) {
            return stack.pop();
        }
        return "";
    };

    /**
     * Adds the parameter to the top of the TextStack.
     *
     * @param s String to be added to the top of the TextStack
     * @requires s be of type String and not null
     * @modifies s will be inserted into the top of the TextStack and its size will increase by 1
     */
    this.push = function (s) {
        stack.push(s);
    };

    /**
     * Returns the the string at the top of this TextStack or "" if this TextStack
     * is empty.
     *
     * @this {TextStack}
     * @returns {String} string at the top of the TextStack
     */
    this.peek = function () {
        if (!this.isEmpty()) {
            var text = this.pop();
            this.push(text);
            return text;
        }
        return "";
    };

    /**
     * Deletes all of the contents of this TextStack and makes it an empty TextStack
     *
     * @modifies TextStack will be set to empty
     */
    this.clear = function () {
        stack = [];
    };

    /**
     * Returns a boolean representing of the TextStack is not storing any elements.
     *
     * @this {TextStack}
     * @returns {boolean} True if this TextStack is empty (has no elements) and False otherwise
     */
    this.isEmpty = function () {
        return this.size() === 0;
    };

    /**
     * @this {TextStack}
     * @returns {Number} how many elements are in this TextStack
     */
    this.size = function () {
        return stack.length;
    };
};

/**
 *  Input Text represents the text box for this app. It provides the main ascii conversion
 *  functionality and also allows the text box to undo/redo any of its edits. In terms of
 *  undo/redo functionality, InputText stores all edits in a timeline where [steps to undo] -
 *  [pointer] - [steps to redo]. Pointer is what is shown in the textbox and can move to any
 *  location along the revision timeline.
 *
 * @constructor
 * @this {InputText}
 */
function InputText() {

    /** @private */ var input = document.getElementById("textInput");
    /** @private */ var backStack = new TextStack();
    /** @private */ var fwdStack = new TextStack();

    /**
     * If nothing has changed since the last call to add, a stores a string to the
     * stored previous versions to be available upon undo. Also clears all stored redo steps.
     *
     * @private
     * @param s the string to be added to this revision history.
     * @requires s must be a string
     * @modifies if s isn't equivalent to the last item in the revision history,
     *           then s will be added to the past revision history and the forwards
     *           history will be cleared.
     */
    function add(s) {
        if (backStack.peek() !== s) {
            backStack.push(s);
            fwdStack.clear();
        }
        /* FOR DEBUGGING PURPOSES
         console.log("back: " + backStack.size());
         console.log("FWD: " + fwdStack.size());
         */
    }

    /**
     * @modifies InputText will move back one step in the revision timeline if possible
     */
    this.back = function () {
        // stores a change if it was made
        add(input.value);
        if (backStack.size() !== 0) {
            fwdStack.push(backStack.pop());
            input.value = backStack.peek();
        }
        /* FOR DEBUGGING PURPOSES
         console.log("back: " + backStack.size());
         console.log("FWD: " + fwdStack.size());
         */
    };

    /**
     * @modifies InputText will move forward one step in the revision timeline if possible
     */
    this.forward = function () {
        if (fwdStack.size() !== 0) {
            var fwdText = fwdStack.pop();
            backStack.push(fwdText);
            input.value = fwdText;
        }
        /* FOR DEBUGGING PURPOSES
         console.log("back: " + backStack.size());
         console.log("FWD: " + fwdStack.size());
         */
    };

    /**
     *
     */
    this.convert = function () {
        var rawText = input.value;
        add(rawText);

        // Quantifiers (IDE Might Show Errors)
        rawText = rawText.replace(/{A}/g, "∀");
        rawText = rawText.replace(/{E}/g, "∃");

        // Quantifiers (IDE Might Show Errors)
        rawText = rawText.replace(/{U}/g, "∪");
        rawText = rawText.replace(/{u}/g, "∩");
        rawText = rawText.replace(/{u>}/g, "⊂");
        rawText = rawText.replace(/{ue}/g, "∈");
        rawText = rawText.replace(/{u=}/g, "⊆");

        // Propositinal Logic Symbols
        rawText = rawText.replace(/<_>/g, "↔");
        rawText = rawText.replace(/->/g, "→");
        rawText = rawText.replace(/:=/g, "≡");
        rawText = rawText.replace(/not /g, "¬");
        rawText = rawText.replace(/not/g, "¬");
        rawText = rawText.replace(/and/g, "∧");
        rawText = rawText.replace(/xor/g, "⊕")
        rawText = rawText.replace(/or/g, "∨");

        // Put back characters to remain non-changed. 
        rawText = rawText.replace(/\\∨/g, "\\or");
        rawText = rawText.replace(/\\¬/g, "\\not ");
        rawText = rawText.replace(/\\∧/g, "\\and");
        rawText = rawText.replace(/\\⊕/g, "\\xor");

        input.value = rawText;
        add(rawText);
    };

    this.removeSlashes = function () {
        var rawText = input.value;
        add(rawText);

        rawText = rawText.replace(/\\or/g, "or");
        rawText = rawText.replace(/\\not /g, "not ");
        rawText = rawText.replace(/\\and/g, "and");
        rawText = rawText.replace(/\\xor/g, "xor");
        input.value = rawText;
        add(rawText)
    };
};


document.addEventListener("keydown", function (evt) {

    if (evt.ctrlKey) {
        if (evt.keyCode == 90) {
            evt.preventDefault();
            textBox.back();
        } else if (evt.keyCode == 89) {
            evt.preventDefault();
            textBox.forward();
        } else if (evt.keyCode == 84) {
            evt.preventDefault();
        }
    } else if (evt.keyCode == 84 && (evt.altKey)) {
        evt.preventDefault();
        textBox.convert();
    }
});

function convert() {
    textBox.convert();
}

function removeSlashes() {
    textBox.removeSlashes();
}
