class WordClusterApp {
    constructor(data) {
        // (sample) data
        this.data = data;

        // Settings for cluster creation
        this.settings = {
            categoryName: undefined,
            wordCount: undefined,
            targetRatio: undefined,
            sizeWeight: undefined,
            ratioWeight: undefined,
            showSolution: undefined
        };

        // Clue and cluster area elements
        this.cluesArea = document.getElementById('cluesArea');
        this.clusterArea = document.getElementById('clusterArea');

        // Settings elements
        this.categoryInput = document.getElementById('categoryInput');
        this.wordCountInput = document.getElementById('wordCountInput');
        this.wordCountHeader = document.getElementById('wordCountHeader');
        this.showSolutionInput = document.getElementById('showSolutionInput');
        this.targetRatioInputs = document.querySelectorAll('input[name="targetRatio"]');
        this.weightInput = document.getElementById('weightInput');
        this.newClusterButton = document.getElementById('newClusterButton')

        // Initialize elements and settings
        this.init();
    }

    init() {

        // Initialize category and word count inputs
        // (and their values)
        this.initCategoryInput();
        this.initWordCountInput();

        // Update show solution value
        this.settings.showSolution = this.showSolutionInput.checked;

        // Update target ratio value
        this.settings['targetRatio'] = parseFloat(document.querySelector('input[name="targetRatio"]:checked').value);

        // Update weight values
        const weightInputValue = parseInt(this.weightInput.value);
        this.settings['sizeWeight'] = (100 - weightInputValue) / 100;
        this.settings['ratioWeight'] = weightInputValue / 100;

        // Add event listeners
        this.categoryInput.addEventListener('change', () => this.onCategoryInputChange());
        this.wordCountInput.addEventListener('change', () => this.onWordCountInputChange());
        this.showSolutionInput.addEventListener('change', () => this.onShowSolutionInputChange());
        this.targetRatioInputs.forEach(radioButton => {
            radioButton.addEventListener('change', e => this.onTargetRatioInputChange(e));
        });
        this.weightInput.addEventListener('change', () => this.onWeightInputChange());
        this.newClusterButton.addEventListener('click', () => this.onNewClusterButtonClick());

        // Clue and cluster area initial messages
        const initialCluesAreaMessage = 'Inga\nledtrådar\nännu...';
        const initialClusterAreaMessage = 'Inget\nkorsord\nännu...';
        this.clearCluesOrClusterArea(this.cluesArea, initialCluesAreaMessage);
        this.clearCluesOrClusterArea(this.clusterArea, initialClusterAreaMessage);
    }

    initCategoryInput() {

        // Get all category names from the data
        const categoryNames = Object.keys(this.data);
        categoryNames.forEach(categoryName => {

            // Create an option element for each category
            const optionElement = document.createElement('option');
            optionElement.text = this.data[categoryName].description;
            optionElement.value = categoryName;

            this.categoryInput.add(optionElement);
        });

        // Initialize with first categiry
        const initCategoryName = categoryNames[0];
        this.categoryInput.value = initCategoryName;

        // Update settings
        this.settings['categoryName'] = initCategoryName;
    }

    initWordCountInput() {

        // Current category and word count
        const currentCategoryName = this.settings['categoryName'];
        const currentWordCount = this.settings['wordCount'];

        // Update max
        const newMaxWordCount = this.data[currentCategoryName].wordsAndClues.length;
        this.wordCountInput.max = newMaxWordCount;

        // Update values if current word count exceeds new max
        if (currentWordCount === undefined || currentWordCount > newMaxWordCount) {

            // Update value
            this.wordCountInput.value = newMaxWordCount;

            // Update header
            this.updateWordCountHeader(newMaxWordCount);

            // Update settings
            this.settings['wordCount'] = newMaxWordCount;
        }
    }

    updateWordCountHeader(wordCount) {
        this.wordCountHeader.textContent = `Antal ord (${wordCount})`;
    }

    clearCluesOrClusterArea(cluesOrClusterArea, message) {

        // Clear
        cluesOrClusterArea.innerHTML = '';

        // Create no content element
        const noContentElement = document.createElement('div');
        noContentElement.classList.add('noContent');

        // Add the message (keeping line breaks)
        noContentElement.innerHTML = message.replaceAll('\n', '<br>');

        // Add to area
        cluesOrClusterArea.appendChild(noContentElement);
    }

    getRandomCurrentData() {

        // For words, clues and title
        const randomCurrentData = {};

        // Current category name and word count
        const currentCategoryName = this.settings.categoryName;
        const currentWordCount = this.settings.wordCount;

        // Get a shuffled array of the words and clues
        const allWordsAndClues = this.data[currentCategoryName].wordsAndClues;
        shuffleArray(allWordsAndClues);

        // Only keep elements up to word count
        const randomCurrentWordsAndClues = allWordsAndClues.slice(0, currentWordCount);

        randomCurrentData.wordsAndClues = randomCurrentWordsAndClues;
        randomCurrentData.title = this.data[currentCategoryName].title; // title for current category

        return randomCurrentData
    }

    createClues(clues, title) {

        // Clear clue area
        this.cluesArea.innerHTML = '';

        // Create the clues container
        const cluesContainer = document.createElement('div');
        cluesContainer.id = 'cluesContainer';

        // Create the clues header
        const cluesHeader = document.createElement('h3');
        cluesHeader.textContent = title;
        this.cluesArea.appendChild(cluesHeader);

        // Create the clues
        clues.forEach((clue, index) => {

            // The clue element
            const clueElement = document.createElement('div');
            clueElement.classList.add('clue');

            // The id
            const clueIdElement = document.createElement('div');
            clueIdElement.classList.add('clueId');
            clueIdElement.textContent = index + 1; // no zero

            // The clue text
            const clueTextElement = document.createElement('div');
            clueTextElement.classList.add('clueText');
            clueTextElement.textContent = clue;

            // Append id and clue to clueElement
            clueElement.append(clueIdElement, clueTextElement);

            // Append clueElement to cluesContainer
            cluesContainer.append(clueElement);
        });

        // Append cluesContainer to cluesArea
        this.cluesArea.appendChild(cluesContainer);
    }

    createCluster(words) {

        // Make words lowercase
        const lowerCaseWords = words.map(word => word.toLowerCase());

        // Get the best cluster (getBestCluster in file wordCluster.js)
        // (last parameter n, the number of one-shot tries, left out)
        const cluster = getBestCluster(
            lowerCaseWords,
            this.settings.sizeWeight,
            this.settings.ratioWeight,
            this.settings.targetRatio);

        // Check if no cluster found
        if (cluster === -1) {

            // No cluster found message
            const noClusterFoundMessage = `Inget korsord skapat.\nFörsök igen eller\nändra inställningarna.`;
            this.clearCluesOrClusterArea(this.clusterArea, noClusterFoundMessage);

            return -1;
        };

        // Clear cluster area
        this.clusterArea.innerHTML = '';

        // Cluster found => get the cluster as a grid
        const clusterGrid = getClusterGrid(cluster);
        const clusterWidth = clusterGrid[0].length;
        const clusterHeight = clusterGrid.length;

        // Create clusterGrid element
        const clusterGridElement = document.createElement('div');
        clusterGridElement.id = 'clusterGrid';

        // Handle scaling

        // Width and height in pixels, with a one-cell 'border'
        const widthCellSize = this.clusterArea.clientWidth / (clusterWidth + 2);
        const heightCellSize = this.clusterArea.clientHeight / (clusterHeight + 2);
        // The smallest of these sizes
        const cellSizePx = Math.min(widthCellSize, heightCellSize);
        // The size in rem, assuming a root font size of 16px
        // (this should be done in some other way)
        const rootFontSizePx = 16;
        const cellSizeRem = Math.min(cellSizePx / rootFontSizePx, 2.5); // clamp to 2.5

        clusterGridElement.style.fontSize = `${cellSizeRem}rem`;

        // Set up the grid
        clusterGridElement.style.gridTemplateColumns = `repeat(${clusterWidth}, 1fr)`;
        clusterGridElement.style.gridTemplateRows = `repeat(${clusterHeight}, 1fr)`;
        clusterGridElement.style.width = `calc(${clusterWidth} * var(--cluster-cell-width))`;
        clusterGridElement.style.height = `calc(${clusterHeight} * var(--cluster-cell-height))`;

        // For all cluster cells in the grid
        for (let i = 0; i < clusterHeight; i++) {
            for (let j = 0; j < clusterWidth; j++) {

                const clusterCell = clusterGrid[i][j];

                // If cluster cell at position
                if (clusterCell !== undefined) {

                    // Create the element
                    const cellElement = document.createElement('div');
                    cellElement.classList.add('clusterGridCell');

                    // Position it
                    cellElement.style.gridColumn = `${j + 1} / ${j + 2}`;
                    cellElement.style.gridRow = `${i + 1} / ${i + 2}`;

                    // Check if letter or clue
                    if (clusterCell.type === 'letter') {

                        cellElement.classList.add('letter');

                        // If solution showed
                        if (this.settings.showSolution) {
                            // Create the letter and append to cell element
                            const letterElement = document.createTextNode(clusterCell.letter);
                            cellElement.appendChild(letterElement);
                        }

                    } else {
                        // Create the clue id and append to cell element
                        cellElement.classList.add('clue', clusterCell.orientation);
                        // The clue id
                        // (this will become a problem if non-unique words are present)
                        const clueId = words.findIndex(word => word.toLowerCase() === clusterCell.word.toLowerCase());
                        const clueElement = document.createTextNode(parseInt(clueId + 1)); // no zero

                        cellElement.appendChild(clueElement);
                    }

                    clusterGridElement.appendChild(cellElement);
                }
            }
        }

        // Append cluster grid element to grid area element
        this.clusterArea.appendChild(clusterGridElement);
    }

    onCategoryInputChange() {

        // Update category name value
        const newCategoryName = this.categoryInput.value;
        this.settings['categoryName'] = newCategoryName;

        // Initialize word count input with new category
        this.initWordCountInput();
    }

    onWordCountInputChange() {

        // Update word count value
        const newWordCount = parseInt(this.wordCountInput.value);
        this.settings['wordCount'] = newWordCount;

        // Update word count header
        this.updateWordCountHeader(newWordCount);
    }

    onShowSolutionInputChange() {
        // Update show solution value
        this.settings.showSolution = this.showSolutionInput.checked;
    }

    onTargetRatioInputChange(e) {
        // Update value to the checked button's value
        if (e.target.checked) this.settings['targetRatio'] = parseFloat(e.target.value);
    }

    onWeightInputChange() {

        // Update weight values
        const weightInputValue = parseInt(this.weightInput.value);
        const newSizeWeight = (100 - weightInputValue) / 100;
        const newRatioWeight = weightInputValue / 100;
        this.settings['sizeWeight'] = newSizeWeight;
        this.settings['ratioWeight'] = newRatioWeight;
    }

    onNewClusterButtonClick() {

        // Get random words and clues
        const randomCurrentData = this.getRandomCurrentData();
        const clues = randomCurrentData.wordsAndClues.map(item => item.clue);
        const words = randomCurrentData.wordsAndClues.map(item => item.word);
        const title = randomCurrentData.title;

        // Create cluster
        const clusterCreated = this.createCluster(words);

        // Only create clues if cluster creation successful
        if (clusterCreated !== -1) {
            // Create clues
            this.createClues(clues, title);
        } else {
            // Clear clues area and add message
            const noClusterCluesMessage = 'Inga\nledtrådar\nännu...';
            this.clearCluesOrClusterArea(this.cluesArea, noClusterCluesMessage);
        }
    }
}