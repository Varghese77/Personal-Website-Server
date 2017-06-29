// Roy Varghese Mathew
// September 1st 2016
// 
// This script provides the main logic behind Article_Summarizer. The printed condensed 
// article summary will include the full original introduction and conclusion paragraphs 
// as well as a summarized body. This summarized body is calculated by scoring each word in 
// the article based on how many times it appears and then calculating the total score of 
// each body sentence. The top body sentences are then reprinted in chronological order. 
//
// Alpha Build 1.0

// abrevs contain phrases that end in "." that don't indicate the end of a sentence
var abrevs = ["mr.", "ms.", "mrs.", "dr.", "fr.", "sr.", "m.d.", "u.s.", "u.k.", "u.s.a.", 
	"a.m.", "p.m.", "p.s.", "ect.", "st."];

// Associative Array that will hold each's words score (number of times it appears in the 
// article)
var wordCount;


// Node object is a wrapper for all information relating to each body sentence that can also
// link to other Nodes.
function Node(sentence) {
	this.sentence = sentence;  // Sentence text
	this.score;                // Total score of the sentence
	this.sentenceNumber;       // Sentence chronological placement

	this.next;                 // Next Node in the List
}

// Heap object is a Linked List that stores a maximum of <max> Nodes. It will store the
// top <max> Nodes that this list receives in increasing order. 
function Heap(max) {
	this.front;
	this.max = max;            // Maximum number of Nodes that this list will store at a time.
	this.size = 0;             // Number of Nodes currently in list

	// Pre: <node> must have a valid score. It is recommended to have an nonempty sentence field 
	// and valid sentence number
	// 
	// Determines if the <node> parameter should be placed in the list (is in the top ten Nodes
	// that it has ever received). If so, then the Node is placed in the appropriate position in 
	// increasing order and the list is adjusted accordingly. 
	this.add = function(node) {
		if (this.front == undefined) { // First Node list receives
			this.front = node;
			this.size++;
		} else if (this.size < this.max){ // List doesn't have <max> nodes stored yet
			if (node.score <= this.front.score) { // <node> is placed in front of list
				node.next = this.front;
				this.front = node;
			} else { // Node is appropriatly inserted into list
				this.insertNode(node)
			}
			this.size++;
		} else {  // List has <max> Nodes and needs to determine where/if it should store <node>
			if (node.score > this.front.score) {
				this.insertNode(node);
				// Unlinks front Node because it is no longer in the top <max>
				this.front = this.front.next;
			}
		}
	};
	
	// Pre: <node> should have a score that is greater than this.front.score. 
	// 
	// This method takes in <node> and places it into the appropriate location 
	// in the list based on increasing order.
	this.insertNode = function(node) {
		var p1 = this.front;
		var p2 = this.front.next;
			while (p2 != undefined && node.score >= p2.score) {
				p1 = p2;
				p2 = p2.next;
			}
		p1.next = node;
		node.next = p2;
	}
	
	// Returns the Nodes in list into a sorted Array based on increasing 
	// order of the sentenceNumber field
	this.getSortedArray = function() {
		var arr = []; 
		var curr = this.front;
		while (curr != undefined) {
			arr[arr.length] = curr;
			curr = curr.next;
		}
		return arr.sort(function(a, b){return a.sentenceNumber-b.sentenceNumber});
	};
	
	
}

// Main function that initializes when the <Summarize!> button is clicked in the webpage. 
// Method will replace the text in the textarea with a summarized version based on the 
// algorithm stated above and the user inputted desired number of body sentences. 
function onClick(){
	var max = parseInt(document.getElementById("number_input").value);
	wordCount = [];
	var textBox = document.getElementById("article");
	var articleText = textBox.value;
	var paragraphs = articleText.split("\n");
	var body = "";
	for (i = 0; i < paragraphs.length; i++){
		body += paragraphs[i] + " ";
	}
	var bodyWords = body.split(" ");
	
	// Updates wordCount Associative Array where wordCount[word] = score. 
	bodyWords = updateWordCount(bodyWords);
	
	// Creates Heap of top <max> body sentences based on the score field
	var list = getSentenceList(bodyWords, max);
	
	// Gets Sorted Array of Nodes in <list> based on the SentenceNumber field
	// (or sentence chronological order).
	var sentenceNodes = list.getSortedArray();
	
	// Creates a string of the summarized body paragraphs by concantonating 
	// all the sentences in <sentenceNodes>
	var summarizedArticle = "";
	for (i = 0; i < sentenceNodes.length; i++){
		summarizedArticle += sentenceNodes[i].sentence;
	}

	// Replaces text in textarea with summarized article.
	textBox.value = paragraphs[0] + "\n\n" + summarizedArticle + "\n\n" + 
		paragraphs[paragraphs.length - 1];
}

// Pre: <words> must not be undefined
//
// Takes in an array or strings and adds them to <wordCount> if the strings haven't been 
// seen yet with a score of one or increments the score in <wordCount> if the string is a 
// repeat. 
function updateWordCount(words){
	for (var i = 0; i < words.length; i++) {
		word = words[i].toLowerCase();

		if ((word.endsWith(".") || (word.endsWith("!"))) && !checkForAbrev(word)){
			word = word.substring(0, word.length - 1);
			// "$~$" indicates the end of a sentence now that the period is removed.
			words[i] = words[i].substring(0, words[i].length - 1) + "$~$";
		}

		word = stripWord(word);

		// word key is stored with a ":" concatonated on because some words might invoke
		// global functions.
		if(wordCount[":" + word] == undefined) {
			wordCount[":" + word] = 1;
		} else {
			wordCount[":" + word] += 1;
		}
	}
	return words;
}

// Pre: bodywords must not be undefined and max must be greater than 0
//
// Returns a Linked List that stores up to <max> of top body sentences based on total
// score.
function getSentenceList(bodyWords, max) {
	var sentence = "";
	var sentenceNumber = 0;
	var score = 0;
	var list = new Heap(max);
	for (i = 0; i < bodyWords.length; i++) {
		word = bodyWords[i].toLowerCase();
		word = stripWord(word);
		
		if (word.endsWith("$~$")){  // End of a sentence. 
			sentenceNumber++;
			
			word = word.substring(0, word.length - 3);
			bodyWords[i] = bodyWords[i].substring(0, bodyWords[i].length - 3) + ". ";
			sentence += bodyWords[i];
			score += wordCount[":" + word];
			
			// Adds node to Heap list
			var node = new Node(sentence);
			node.score = score;
			node.sentenceNumber = sentenceNumber;
			list.add(node);

			sentence = "";
			score = 0;
		} else {
			sentence += bodyWords[i] + " ";
			score += wordCount[":" + word];
		}
	}
	return list;
}

// Pre: word must not be undefined
//
// Removes any special characters ("\", "(", ")", "\n") from <word> to get a more generalised
// form of the string. 
function stripWord(word) {
		while (word.endsWith("\"") || word.endsWith(")")){
			word = word.substring(0, word.length - 1); 
		}
		
		while (word.charAt(0) == "\"" || word.charAt(0) == "(" || word.charAt(0) == "\n"){
			word = word.substring(1, word.length); 
		}
		return word;
}

// Tests whether <word> is any of the special abreviates stored in <abrevs> above. 
function checkForAbrev(word) {
	for (k = 0; k < abrevs.length; k++){
		if (abrevs[i] == word) {
			return true;
		}
	}
	return false;
}
