describe("CharRepository", function(){
    var charRepository = new CharRepository();

    describe("getCharWidth", function(){
        it("should get a number that is larger than 0", function(){
            expect(charRepository.getCharWidth('w')).toBeGreaterThan(0);
            expect(charRepository.getCharWidth(' ')).toBeGreaterThan(0);
        });
    });

    describe("wrap", function(){
        it("should split the text into lines according to the specified width", function(){
            spyOn(charRepository, "getCharWidth").andReturn(10);
            expect(charRepository.splitIntoLines("www", 100)).toEqual([{content: "www", length: 3}]);
            expect(charRepository.splitIntoLines("wwwwwwwwwww", 100)).toEqual([{content: "wwwwwwwwww", length: 10}, {content: 'w', length: 1}]);
        });
    });
});

describe("Line", function() {
    var line = null;

    beforeEach(function(){
        var properties = {};
        properties.charRepository = new CharRepository();
        properties.width = 300;
        properties.lineHeight = 30;
        line = new Line(properties);

        spyOn(properties.charRepository, "getCharWidth").andReturn(30);
    });

    describe("insertText", function(){
        it("should insert the text after the position", function(){
            var result = line.insertText("www", 0);
            expect(line.content, "www");
            expect(result.exceeded).toEqual(false);
            expect(result.charIndex).toEqual(3);

            var result = line.insertText("wwwwwwwwwww", 0);
            expect(result.exceeded).toEqual(true);
            expect(result.extra).toEqual("wwww");
        });

        it("should throw error if the insert position is not valid", function(){
            expect(function(line){line.insertText("www", 6);}).toThrow();
        });
    });

    describe("getText", function(){
        beforeEach(function(){
            line.insertText("wwwwww", 0);
        });

        it("should get the substring between the specified start position and end position", function() {
            expect(line.content).toEqual("wwwwww");
            expect(line.length).toEqual(6);
            expect(line.getText(1, 3)).toEqual("ww");
        });

        it("should throw an error when the start position or end position is not valid", function(){
            expect(line.content).toEqual("wwwwww");
            expect(line.length).toEqual(6);
            expect(function(line){line.getText(-1, 2);}).toThrow();
            expect(function(line){line.getText(5, 8);}).toThrow();
            expect(function(line){line.getText(3, 1);}).toThrow();
        });
    });

    describe("deleteText", function(){
        beforeEach(function(){
            line.insertText("wwwwww", 0);
        });

        it("should delete text between the specified start position and end position and store the new length", function(){
            expect(line.content).toEqual("wwwwww");
            expect(line.length).toEqual(6);
            line.deleteText(1, 3);
            expect(line.content).toEqual("wwww");
            expect(line.length).toEqual(4);
        });

        it("should throw an error when the start position or end position is not valid", function(){
            expect(line.content).toEqual("wwwwww");
            expect(line.length).toEqual(6);
            expect(function(line){line.deleteText(-1, 2);}).toThrow();
            expect(function(line){line.deleteText(5, 8);}).toThrow();
            expect(function(line){line.deleteText(4, 2);}).toThrow();
        });
    })
});

describe("Paragraph", function(){
    var properties = {};
    var paragraph = null;

    beforeEach(function(){
        properties.charRepository = new CharRepository();
        properties.width = 300;
        properties.lineHeight = 30;

        paragraph = new Paragraph(properties);

        spyOn(properties.charRepository, "getCharWidth").andReturn(30);
    });

    describe("insertText", function(){
        it("should insert the text after the position", function(){
            paragraph.insertText("www", {lineIndex: 0, charIndex: 0});
            expect(paragraph.lines.length).toEqual(1);
            expect(paragraph.lines[0].content).toEqual("www");

            paragraph.insertText("wwwwwwwwwwwwwww", {lineIndex: 0, charIndex: 0});
            expect(paragraph.lines.length).toEqual(2);
            expect(paragraph.lines[0].content).toEqual("wwwwwwwwww");
            expect(paragraph.lines[1].content).toEqual("wwwwwwww");
        });

        it("should throw an error when the insert position is not valid", function(){
            expect(function(paragraph){paragraph.insertText("w", {lineIndex: 0, charIndex: 1});}).toThrow();
            expect(function(paragraph){paragraph.insertText("w", {lineIndex: 1, charIndex: 0});}).toThrow();
            expect(function(paragraph){paragraph.insertText("w", {lineIndex: 1, charIndex: -1});}).toThrow();
        });
    });

    describe("getText", function(){
        beforeEach(function(){
            paragraph.insertText("wwwwwwwwwwwwwww", {lineIndex: 0, charIndex: 0});
        });

        it("should get the text between the start position and the end position", function(){
            expect(paragraph.lines[0].content).toEqual("wwwwwwwwww");
            expect(paragraph.lines[1].content).toEqual("wwwww");

            expect(paragraph.getText({lineIndex: 0, charIndex: 0}, {lineIndex: 0, charIndex: 3})).toEqual("www");
            expect(paragraph.getText({lineIndex: 0, charIndex: 1}, {lineIndex: 1, charIndex: 1})).toEqual("wwwwwwwwww");
            expect(paragraph.getText({lineIndex: 0, charIndex: 10}, {lineIndex: 1, charIndex: 1})).toEqual("w");
        });

        it("should throw an error when the start position or end position is not valid", function(){
            expect(paragraph.lines[0].content).toEqual("wwwwwwwwww");
            expect(paragraph.lines[1].content).toEqual("wwwww");

            expect(function(paragraph){paragraph.getText({lineIndex: 0, charIndex: -1}, {lineIndex: 0, charIndex: 3})}).toThrow();
            expect(function(paragraph){paragraph.getText({lineIndex: 0, charIndex: 0}, {lineIndex: 1, charIndex: 6})}).toThrow();
            expect(function(paragraph){paragraph.getText({lineIndex: 0, charIndex: 3}, {lineIndex: 0, charIndex: 1})}).toThrow();
        });
    });

    describe("deleteText", function(){
        beforeEach(function(){
            paragraph.insertText("wwwwwwwwwwwwwww", {lineIndex: 0, charIndex: 0});
        });

        it("should delete the text between the start position and end position", function(){
            expect(paragraph.lines[0].content).toEqual("wwwwwwwwww");
            expect(paragraph.lines[1].content).toEqual("wwwww");

            paragraph.deleteText({lineIndex: 0, charIndex: 0}, {lineIndex: 0, charIndex: 3});
            expect(paragraph.lines.length).toEqual(2);
            expect(paragraph.lines[0].content).toEqual("wwwwwwwwww");
            expect(paragraph.lines[1].content).toEqual("ww");

            paragraph.deleteText({lineIndex: 0, charIndex: 9}, {lineIndex: 1, charIndex:2});
            expect(paragraph.lines.length).toEqual(1);
            expect(paragraph.lines[0].content).toEqual("wwwwwwwww");
        });

        it("should throw an error when the start position or the end position is not valid", function(){
            expect(paragraph.lines[0].content).toEqual("wwwwwwwwww");
            expect(paragraph.lines[1].content).toEqual("wwwww");

            expect(function(){ paragraph.deleteText({lineIndex: 0, charIndex: -1}, {lineIndex: 1, charIndex:2});}).toThrow();
            expect(function(){ paragraph.deleteText({lineIndex: 0, charIndex: 0}, {lineIndex: 1, charIndex:8});}).toThrow();
            expect(function(){ paragraph.deleteText({lineIndex: 1, charIndex: 0}, {lineIndex: 0, charIndex:5});}).toThrow();
        });
    });
});

describe("TextLayer", function(){
    var properties = {};
    var textLayer = null;

    beforeEach(function(){
        properties.charRepository = new CharRepository();
        properties.width = 300;
        properties.lineHeight = 30;

        textLayer = new TextLayer(properties);

        spyOn(properties.charRepository, "getCharWidth").andReturn(30);
    });

    describe("insertText", function(){
        it("should insert the text after the position", function(){
            textLayer.insertText("www", {paragraphIndex: 0, lineIndex: 0, charIndex: 0});
            expect(textLayer.paragraphs.length).toEqual(1);
            expect(textLayer.paragraphs[0].lines.length).toEqual(1);
            expect(textLayer.paragraphs[0].lines[0].content).toEqual("www");

            textLayer.insertText("wwwwwwwwwww", {paragraphIndex: 0, lineIndex: 0, charIndex: 0});
            expect(textLayer.paragraphs.length).toEqual(1);
            expect(textLayer.paragraphs[0].lines.length).toEqual(2);
            expect(textLayer.paragraphs[0].lines[0].content).toEqual("wwwwwwwwww");
            expect(textLayer.paragraphs[0].lines[1].content).toEqual("wwww");

            textLayer.insertText("www", {paragraphIndex: 1, lineIndex: 0, charIndex:0});
            expect(textLayer.paragraphs.length).toEqual(2);
            expect(textLayer.paragraphs[1].lines[0].content).toEqual("www");
        });

        it("should throw an error when the insert position is out of range", function(){
            expect(function(){textLayer.insertText("www", {paragraphIndex: 1, lineIndex: 0, charIndex: 0});}).toThrow();
            expect(function(){textLayer.insertText("www", {paragraphIndex: -1, lineIndex: 0, charIndex: 0});}).toThrow();
            expect(function(){textLayer.insertText("www", {paragraphIndex: 0, lineIndex: 1, charIndex: 0});}).toThrow();
        });
    });

    describe("deleteText", function(){
        beforeEach(function(){
            textLayer.insertText("wwwwwwwwwwwwwww", {paragraphIndex: 0, lineIndex: 0, charIndex: 0});
            textLayer.insertText("wwwwwwwwwwwwwww", {paragraphIndex: 1, lineIndex: 0, charIndex: 0});
        });

        it("should delete the text between the start position and end position", function(){
            expect(textLayer.paragraphs[0].lines[0].content).toEqual("wwwwwwwwww");
            expect(textLayer.paragraphs[0].lines[1].content).toEqual("wwwww");
            expect(textLayer.paragraphs[1].lines[0].content).toEqual("wwwwwwwwww");
            expect(textLayer.paragraphs[1].lines[1].content).toEqual("wwwww");

            textLayer.deleteText({paragraphIndex: 0, lineIndex: 0, charIndex: 0}, {paragraphIndex: 0, lineIndex: 0, charIndex: 3});
            expect(textLayer.paragraphs[0].lines.length).toEqual(2);
            expect(textLayer.paragraphs[0].lines[0].content).toEqual("wwwwwwwwww");
            expect(textLayer.paragraphs[0].lines[1].content).toEqual("ww");

            textLayer.deleteText({paragraphIndex: 1, lineIndex: 0, charIndex: 0}, {paragraphIndex: 1, lineIndex: 0, charIndex: 3});
            expect(textLayer.paragraphs[1].lines.length).toEqual(2);
            expect(textLayer.paragraphs[1].lines[0].content).toEqual("wwwwwwwwww");
            expect(textLayer.paragraphs[1].lines[1].content).toEqual("ww");

            textLayer.deleteText({paragraphIndex: 0, lineIndex: 1, charIndex: 0}, {paragraphIndex: 1, lineIndex: 0, charIndex: 3});
            expect(textLayer.paragraphs[0].lines.length).toEqual(2);
            expect(textLayer.paragraphs[0].lines[0].content).toEqual("wwwwwwwwww");
            expect(textLayer.paragraphs[0].lines[1].content).toEqual("");
            expect(textLayer.paragraphs[1].lines.length).toEqual(1);
            expect(textLayer.paragraphs[1].lines[0].content).toEqual("wwwwwwwww");
        });

        it("should throw an error when the start position or the end position is not valid", function(){
            expect(textLayer.paragraphs[0].lines[0].content).toEqual("wwwwwwwwww");
            expect(textLayer.paragraphs[0].lines[1].content).toEqual("wwwww");
            expect(textLayer.paragraphs[1].lines[0].content).toEqual("wwwwwwwwww");
            expect(textLayer.paragraphs[1].lines[1].content).toEqual("wwwww");

            expect(function(){ textLayer.deleteText({paragraphIndex: -1, lineIndex: 0, charIndex: 0}, {paragraphIndex: 0, lineIndex: 1, charIndex:2});}).toThrow();
            expect(function(){ textLayer.deleteText({paragraphIndex: 2, lineIndex: 0, charIndex: 0}, {paragraphIndex: 0, lineIndex: 1, charIndex:2});}).toThrow();
            expect(function(){ textLayer.deleteText({paragraphIndex: 1, lineIndex: 0, charIndex: 0}, {paragraphIndex: 0, lineIndex: 1, charIndex:2});}).toThrow();
        });
    });
});