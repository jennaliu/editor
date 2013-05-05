(function($){
    function htmlEncode(str){
        var result = str;
        result = result.replace(/&/g, "&amp;");
        result = result.replace(/"/g, "&quote;");
        result = result.replace(/\\/g, "&#39;");
        result = result.replace(/</g, "&lt;");
        result = result.replace(/>/g, "&gt;");
        result = result.replace(/ /g, "&nbsp;");
        return result;
    };

    //------------------TEXT INPUT--------------------
    var TextInput = function(){
        this.KEY = {
            Backspace: 8,
            Enter: 13,
            Delete: 46,
            LeftArrow: 37,
            RightArrow: 39,
            UpArrow: 38,
            DownArrow: 40
        };
        this.$element = $('<textarea class="text-input"></textarea>');
        this.$element.on("textInput", this.onTextInput.bind(this));
        this.$element.on("keydown", this.onKeyDown.bind(this));
    };

    (function(){
        this.onTextInput = function(event){
            var self = this;
            setTimeout(function(){
                $(self).trigger("textInput", self.$element.val());
                self.$element.val("");
            }, 0)
        };
        this.focus = function(event){
            this.$element.focus();
        };
        this.onKeyDown = function(event){
            if(event.keyCode == this.KEY.Backspace){
                $(this).trigger("backspacePressed");
            }else if(event.keyCode == this.KEY.Enter){
                $(this).trigger("enterPressed");
            }else if(event.keyCode == this.KEY.Delete){
                $(this).trigger("deletePressed");
            }else if(event.keyCode == this.KEY.UpArrow){
                $(this).trigger("upArrowPressed");
            }else if(event.keyCode == this.KEY.DownArrow){
                $(this).trigger("downArrowPressed");
            }else if(event.keyCode == this.KEY.LeftArrow){
                $(this).trigger("leftArrowPressed");
            }else if(event.keyCode == this.KEY.RightArrow){
                $(this).trigger("rightArrowPressed");
            }
        };
    }).call(TextInput.prototype);

    //------------------CURSOR--------------------
    var Cursor = function(){
        this.$element = $('<div class="cursor"></div>');
        this._activate();
    };

    (function(){
        this._activate = function(){
            var self = this;
            this.blinkId = setInterval(function() {
                self.$element.css("visibility", "hidden");
                setTimeout(function() {
                    self.$element.css("visibility", "visible");
                }, 400);
            }, 1000);
        };
        this.moveTo = function(position){
            this.$element.css("top", position.y);
            this.$element.css("left", position.x);
        };
    }).call(Cursor.prototype);

    //------------------CURSOR LAYER--------------------
    var CursorLayer = function(){
        this.$element = $('<div class="cursor-layer"></div>');
        this.cursor = new Cursor();
        this.$element.append(this.cursor.$element);

        this.$element.on("click", this.onClick.bind(this));
    };

    (function(){
        this.onClick = function(e){
            var x =  e.clientX - this.$element.offset().left;
            var y =  e.clientY - this.$element.offset().top;
            $(this).trigger("click", [x, y]);
            console.log("coordinates clicked:")
            console.log("x: " + x + " y: " + y);
        };
        this.moveCursorTo = function(pixelPosition){
            this.cursor.moveTo(pixelPosition);
        };
    }).call(CursorLayer.prototype);

    //------------------CHAR REPOSITORY----------------------
    var CharRepository = function(){
        this.charWidthTable = [];
    };

    (function(){
        this._measureCharWidth = function(char){
            var width = 0;
            var $measureNode = $('<div class="measure-node"></div>');
            $(document.body).append($measureNode);
            $measureNode.html(htmlEncode(char));
            width = $measureNode.width();
            $measureNode.text("");
            return width;
        };
        this.getCharWidth = function(char){
            if(this.charWidthTable[char] == undefined){
                var charWidth = this._measureCharWidth(char);
                this.charWidthTable[char] = charWidth;
                return charWidth;
            }else{
                return this.charWidthTable[char];
            }
        };
        this.splitIntoLines = function(text, width){
            var lines = [];
            var lineIndex = 0;
            lines[lineIndex] = {content: "", length: 0};

            var word = "";
            var wordLength = 0;
            var wordWidth = 0;

            var charOffset = 0;
            var textLength = text.length;
            for(var i in text){
                var charWidth = this.getCharWidth(text[i]);
                // When a word is seen
                if(text[i] == " "){
                    // When the word+space fits in current line. Append the word+space to current line.
                    if(charOffset + wordWidth + charWidth <= width){
                        lines[lineIndex].content += word + " ";
                        lines[lineIndex].length += wordLength + 1;
                        charOffset += wordWidth + charWidth;
                    }else{
                        // When the word itself fills current line but not with the space. Assign the word to current line and move to the next line.
                        if(wordWidth <= width && wordWidth + charWidth > width){
                            lines[lineIndex].content = word;
                            lines[lineIndex].length = wordLength;
                            lines[lineIndex + 1] = {content: " ", length: 1};
                            charOffset = charWidth;
                        // When the word+space doesn't fit current line. Move to the next line.
                        }else{
                            lines[lineIndex + 1] = {content: word + " ", length: wordLength + 1};
                            charOffset = wordWidth + charWidth;
                        }
                        lineIndex += 1;
                    }
                    word = "";
                    wordLength = 0;
                    wordWidth = 0;
                }else{
                    // When the word isnot fully seen yet and already fills current line. Assign the part seen to current line and move to the next line.
                    if(wordWidth <= width && wordWidth + charWidth > width){
                        lines[lineIndex].content = word;
                        lines[lineIndex].length = wordLength;
                        lines[lineIndex + 1] = {content: "", length: 0};
                        lineIndex += 1;
                        charOffset = 0;
                        word = text[i];
                        wordLength = 1;
                        wordWidth = charWidth;
                        if(i == textLength -1){
                            lines[lineIndex].content = text[i];
                            lines[lineIndex].length = 1;
                        }
                        // Move to the next character.
                    }else{
                        word += text[i];
                        wordLength += 1;
                        wordWidth += charWidth;
                        if(i == textLength -1){
                            if(charOffset + wordWidth <= width){
                                lines[lineIndex].content += word;
                                lines[lineIndex].length += wordLength;
                            }else{
                                lines[lineIndex + 1] = {content: word, length: wordLength};
                            }
                        }
                    }
                }
            }
            console.log("lines:");
            console.log(lines);
            return lines;
        };
    }).call(CharRepository.prototype);

    //------------------LINE----------------------
    var Line = function(properties){
        this.$element = $('<div class="lineview"></div>');
        this.$element.css("height", properties.lineHeight);
        this.properties = properties;
        this.content = "";
        this.length = 0;
    };

    (function(){
        this.insertText = function(text, position){
            var result = {};
            if(position < 0 | position > this.content.length){
                throw "Insert position out of range.";
            }else{
                var newText = this.content.substring(0, position) + text + this.content.substring(position);
                var textLines = this.properties.charRepository.splitIntoLines(newText, this.properties.width);
                this.content = textLines[0].content;
                this.length = textLines[0].length;
                this.render();
                if(textLines.length > 1){
                    var extra = "";
                    for(var i = 1; i < textLines.length; i++){
                        extra += textLines[i].content;
                    }
                    result = {exceeded: true, extra: extra};
                }else{
                    result = {exceeded: false};
                }
                return result;
            }
        };
        this.getText = function(startPosition, endPosition){
            if(startPosition < 0){
                throw "start position out of range.";
            }else if(endPosition > this.length){
                throw "end position out of range."
            }else if(startPosition > endPosition){
                throw "start position is after the end position."
            }else{
                return this.content.slice(startPosition, endPosition);
            }
        };
        this.deleteText = function(startPosition, endPosition){
            if(startPosition < 0){
                throw "start position out of range.";
            }else if(endPosition > this.length){
                throw "end position out of range."
            }else if(startPosition > endPosition){
                throw "start position is after the end position."
            }else{
                this.content = this.content.substring(0, startPosition) + this.content.substring(endPosition);
                this.length -= endPosition - startPosition;
                this.render();
            }
        };
        this.getPixelPosition = function(position){
            var x = 0;
            for(var i = 0; i < position; i++){
                var charWidth = this.properties.charRepository.getCharWidth(this.content[i]);
                x += charWidth;
            }
            return x;
        };
        this.getPosition = function(x){
            var index = 0;
            var offset = 0;
            for(var i in this.content){
                var charWidth = this.properties.charRepository.getCharWidth(this.content[i]);
                if(offset + charWidth <= x){
                    offset += charWidth;
                    index += 1;
                }else{
                    if((offset + charWidth - x) < (x - offset)){
                        offset += charWidth;
                        index += 1;
                    }
                    break;
                }
            }
            return index;
        };
        this.getPositionAfter = function(position, steps){
            if(position + steps > this.length){
                return {exceeded: true, remainingSteps: position + steps - this.length};
            }else{
                return {exceeded: false, position: position + steps};
            }
        };
        this.render = function(){
            this.$element.html(htmlEncode(this.content));
        };
    }).call(Line.prototype);

    //------------------PARAGRAPH----------------------
    var Paragraph = function(properties){
        this.$element = $('<div class="paragraphview"></div>');
        this.lines = [];
        this.properties = properties;
        this.appendLine(new Line(this.properties));
        this.charCount = 0;
    };

    (function(){
        this.appendLine = function(line){
            this.lines.push(line);
            this.$element.append(line.$element);
        };
        this._removeLines = function(startIndex, endIndex){
            for(var i = startIndex; i <= endIndex; i++){
                this.lines[i].$element.remove();
            }
            this.lines.splice(startIndex, endIndex - startIndex + 1);
        };
        this.insertText = function(text, position){
            this.charCount += text.length;
            this._insertTextRecursively(text, position);
        };
        this._insertTextRecursively = function(text, position){
            var currentLine = this.lines[position.lineIndex];
            var result = currentLine.insertText(text, position.charIndex);
            if(result.exceeded){
                if(position.lineIndex == this.lines.length - 1){
                    var newLine = new Line(this.properties);
                    this.appendLine(newLine);
                }
                this._insertTextRecursively(result.extra, {lineIndex: position.lineIndex + 1, charIndex: 0});
            }
        };
        this.deleteText = function(startPosition, endPosition){
            if(startPosition.lineIndex <= endPosition.lineIndex){
                var textAfter = this.getText(endPosition, this.getLastPosition());
                var startLine = this.lines[startPosition.lineIndex];
                startLine.deleteText(startPosition.charIndex, startLine.length);
                this._removeLines(startPosition.lineIndex + 1, this.lines.length - 1);
                this.insertText(textAfter, startPosition);
            }else{
                throw "start position is after end position."
            }
        };
        this.getText = function(startPosition, endPosition){
            var text = "";
            if(startPosition.lineIndex == endPosition.lineIndex){
                return this.lines[startPosition.lineIndex].getText(startPosition.charIndex, endPosition.charIndex);
            }else if(startPosition.lineIndex < endPosition.lineIndex){
                var startLine = this.lines[startPosition.lineIndex];
                text += startLine.getText(startPosition.charIndex, startLine.length);
                for(var i = startPosition.lineIndex + 1; i < endPosition.lineIndex; i++){
                    text += this.lines[i].content;
                }
                var endLine = this.lines[endPosition.lineIndex];
                text += endLine.getText(0, endPosition.charIndex);
                return text;
            }else{
                throw "start position is after end position."
            }
        };
        this.getPixelPosition = function(position){
            var lineY = 0;
            for(var i = 0; i < position.lineIndex; i++){
                lineY += this.properties.lineHeight;
            }
            var pixelPositionInLine = this.lines[position.lineIndex].getPixelPosition(position.charIndex);
            return {
                x: pixelPositionInLine,
                y: lineY
            }
        };
        this.getPosition = function(coordinates){
            var pixelPositionInContent = {x: coordinates.x, y: coordinates.y};
            var lineIndex = Math.min(Math.floor(pixelPositionInContent.y / this.properties.lineHeight), this.lines.length - 1);
            var charIndex = this.lines[lineIndex].getPosition(pixelPositionInContent.x);
            return {lineIndex: lineIndex, charIndex: charIndex};
        };
        this.getPreviousPosition = function(position){
            if(position.charIndex > 0){
                return {lineIndex: position.lineIndex, charIndex: position.charIndex - 1};
            }else if(position.charIndex == 0){
                if(position.lineIndex > 0){
                    return {lineIndex: position.lineIndex - 1, charIndex: this.lines[position.lineIndex - 1].length - 1};
                }else if(position.lineIndex == 0){
                    return null;
                }else{
                    throw "Line index out of range";
                }
            }else{
                throw "Char index out of range.";
            }
        };
        this.getLastPosition = function(){
            var indexOfLastLine = this.lines.length - 1;
            return {lineIndex: indexOfLastLine, charIndex: this.lines[indexOfLastLine].length};
        };
        this.getPositionAfter = function(position, steps){
            var charIndex = position.charIndex;
            var remainingSteps = steps;
            for(var i = position.lineIndex; i < this.lines.length; i++){
                var result = this.lines[i].getPositionAfter(charIndex, remainingSteps);
                if(result.exceeded){
                   charIndex = 0;
                   remainingSteps = result.remainingSteps;
                }else{
                    return {lineIndex: i, charIndex: result.position};
                }
            }
            throw "end position is out of range.";
        };
        this.isEmpty = function(){
            if(this.lines[0].content.length > 0){
                return false;
            }else{
                return true;
            }
        }
    }).call(Paragraph.prototype);

    //------------------TEXT LAYER----------------------
    var TextLayer = function(properties){
        this.$element = $('<div class="text-layer"></div>');
        this.properties = properties;
        this.paragraphs = [];
        this.appendParagraph(new Paragraph(this.properties));
    };

    (function(){
        this.appendParagraph = function(paragraph){
            this.paragraphs.push(paragraph);
            this.$element.append(paragraph.$element);
        };
        this.insertText = function(text, position){
            var paragraphCount = this.paragraphs.length;
            if(position.paragraphIndex == paragraphCount && !this.paragraphs[paragraphCount - 1].isEmpty()){
                this.appendParagraph(new Paragraph(this.properties));
            }
            if(position.paragraphIndex < this.paragraphs.length){
                var currentParagraph = this.paragraphs[position.paragraphIndex];
                currentParagraph.insertText(text, {lineIndex: position.lineIndex, charIndex: position.charIndex});
            }else{
                throw "paragraph index is out of range.";
            }
        };
        this.deleteText = function(startPosition, endPosition){
            if(startPosition.paragraphIndex < 0){
                throw "start paragraph index is not valid.";
            }else if(endPosition.paragraphIndex >= this.paragraphs.length){
                throw "end paragraph index is not valid."
            }else if(startPosition.paragraphIndex > endPosition.paragraphIndex){
                throw "Start position is after the end position.";
            }else if(startPosition.paragraphIndex == endPosition.paragraphIndex){
                this.paragraphs[startPosition.paragraphIndex].deleteText({lineIndex: startPosition.lineIndex, charIndex: startPosition.charIndex}, {lineIndex: endPosition.lineIndex, charIndex:endPosition.charIndex});
            }else{
                var startParagraph = this.paragraphs[startPosition.paragraphIndex];
                startParagraph.deleteText({lineIndex: startPosition.lineIndex, charIndex: startPosition.charIndex}, startParagraph.getLastPosition());
                var endParagraph = this.paragraphs[endPosition.paragraphIndex];
                endParagraph.deleteText({lineIndex: 0, charIndex: 0}, {lineIndex: endPosition.lineIndex, charIndex: endPosition.charIndex});
                this._removeParagraphs(startPosition.paragraphIndex + 1, endPosition.paragraphIndex - 1);
            }
        };
        this._removeParagraphs = function(startIndex, endIndex){
            for(var i = startIndex; i <= endIndex; i++){
                this.paragraphs[i].$element.remove();
            }
            this.paragraphs.splice(startIndex, endIndex - startIndex + 1);
        };
        this.getPixelPosition = function(position){
            var paragraphY = 0;
            for(var i = 0; i < position.paragraphIndex; i++){
                paragraphY += this.paragraphs[i].getHeight();
            }
            var pixelPositionInParagraph = this.paragraphs[position.paragraphIndex].getPixelPosition({lineIndex: position.lineIndex, charIndex: position.charIndex});
            return {
                x: pixelPositionInParagraph.x,
                y: paragraphY + pixelPositionInParagraph.y
            };
        };
        this.getPosition = function(coordinates){
            var paragraphIndex = 0;
            var offsetY = 0;
            var pixelPositionInParagraph = {x: coordinates.x, y: coordinates.y};
            if(pixelPositionInParagraph.y > 0){
                for(var i = 0; i < this.paragraphs.length; i++){
                    var paragraphHeight = this.paragraphs[i].$element.height();
                    if(offsetY < coordinates.y){
                        paragraphIndex = i;
                        pixelPositionInParagraph.y = coordinates.y - offsetY;
                    }else{
                        break;
                    }
                    offsetY += paragraphHeight;
                }
            }
            var documentPositionInParagraph = this.paragraphs[paragraphIndex].getPosition(pixelPositionInParagraph);
            return {paragraphIndex: paragraphIndex, lineIndex: documentPositionInParagraph.lineIndex, charIndex: documentPositionInParagraph.charIndex};
        };
        this.getPreviousPosition = function(position){
            if(position.paragraphIndex >= 0){
                var previousPositionInParagraph = this.paragraphs[position.paragraphIndex].getPreviousPosition({lineIndex: position.lineIndex, charIndex: position.charIndex});
                if(previousPositionInParagraph != null){
                    return {paragraphIndex: position.paragraphIndex, lineIndex: previousPositionInParagraph.lineIndex, charIndex: previousPositionInParagraph.charIndex};
                }else{
                    if(position.paragraphIndex > 1){
                        var lastPositionInParagraph = this.paragraphs[position.paragraphIndex - 1].getLastPosition();
                        return {paragraphIndex: position.paragraphIndex - 1, lineIndex: lastPositionInParagraph.lineIndex, charIndex: lastPositionInParagraph.charIndex};
                    }else{
                        return null;
                    }
                }
            }else{
                throw "Paragraph index out of range.";
            }
        };
        this.getPositionAfter = function(position, steps){
            var positionInParagraph = this.paragraphs[position.paragraphIndex].getPositionAfter({lineIndex: position.lineIndex, charIndex: position.charIndex}, steps);
            return {paragraphIndex: position.paragraphIndex, lineIndex: positionInParagraph.lineIndex, charIndex: positionInParagraph.charIndex};
        };
        this.splitParagraph = function(position){

        };
    }).call(TextLayer.prototype);

    //----------------------EDITOR----------------------
    var Editor = function(element, options){
        this.$element = $(element);

        this.properties = {};
        this.properties.charRepository = new CharRepository();
        this.properties.width = this.$element.width();
        this.properties.lineHeight = 30;

        this.caretPosition = {paragraphIndex: 0, lineIndex: 0, charIndex: 0};

        this.textLayer = new TextLayer(this.properties);
        this.cursorLayer = new CursorLayer();
        this.textInput = new TextInput();

        this.$element.append(this.textInput.$element);
        this.$element.append(this.cursorLayer.$element);
        this.$element.append(this.textLayer.$element);

        this.focus();
        $(this.textInput).on("textInput", this.onTextInput.bind(this));
        $(this.cursorLayer).on("click", this.onClick.bind(this));
        $(this.textInput).on("backspacePressed", this.onBackspacePressed.bind(this));
        $(this.textInput).on("enterPressed", this.onEnterPressed.bind(this));
    };

    (function(){
        this.onTextInput = function(e, data){
            this.textLayer.insertText(data, this.caretPosition);
            this.caretPosition = this.textLayer.getPositionAfter(this.caretPosition, data.length);
            console.log("current position:");
            console.log(this.caretPosition);
            var pixelPosition = this.textLayer.getPixelPosition(this.caretPosition);
            this.cursorLayer.moveCursorTo(pixelPosition);
        };
        this.focus = function(){
            this.textInput.focus();
        };
        this.onClick = function(e, x, y){
            this.focus();
            var position = this.textLayer.getPosition({x: x, y: y});
            this.caretPosition = position;
            var pixelPosition = this.textLayer.getPixelPosition(position);
            this.cursorLayer.moveCursorTo(pixelPosition);
            console.log("position clicked:")
            console.log(position);
        };
        this.onBackspacePressed = function(){
            var startPosition = this.textLayer.getPreviousPosition(this.caretPosition);
            if(startPosition != null){
                this.textLayer.deleteText(startPosition, this.caretPosition);
                console.log("current position:");
                console.log(startPosition);
                this.caretPosition = startPosition;
                var pixelPosition = this.textLayer.getPixelPosition(startPosition);
                this.cursorLayer.moveCursorTo(pixelPosition);
            }
        };
        this.onEnterPressed = function(){
            this.textLayer.splitParagraph(this.caretPosition);
        };
    }).call(Editor.prototype);

    $.fn.editor = function (option) {
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('editor')
                , options = typeof option == 'object' && option
            if (!data) $this.data('editor', (data = new Editor(this, options)))
        })
    }

    $.fn.editor.Constructor = Editor;

    window.CharRepository = CharRepository;
    window.Line = Line;
    window.Paragraph = Paragraph;
    window.TextLayer = TextLayer;

})(window.jQuery);