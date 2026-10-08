// UTILITY
const randIntBetween = (minInt, maxInt) => {
    return Math.floor(Math.random() * (maxInt - minInt + 1) + minInt);
};

const shuffleArray = arr => {

    // Fisher-Yates
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
};

const normalizeBetween = (lowerLimit, upperLimit, value) => {
    const delta = upperLimit - lowerLimit;
    if (delta === 0) return 1;
    return (value - lowerLimit) / delta;
};

// MEASURES
const getClusterSize = cluster => {

    // All cells and their positions
    const clusterCells = Object.values(cluster);
    const xPositions = clusterCells.map(cell => cell.x);
    const yPositions = clusterCells.map(cell => cell.y);

    // Boundaries
    const xMin = Math.min(...xPositions);
    const xMax = Math.max(...xPositions);
    const yMin = Math.min(...yPositions);
    const yMax = Math.max(...yPositions);

    // Grid size
    const width = xMax - xMin + 1;
    const height = yMax - yMin + 1;

    return width * height;
};

const getClusterRatio = cluster => {

    // All cells and their positions
    const clusterCells = Object.values(cluster);
    const xPositions = clusterCells.map(cell => cell.x);
    const yPositions = clusterCells.map(cell => cell.y);

    // Boundaries
    const xMin = Math.min(...xPositions);
    const xMax = Math.max(...xPositions);
    const yMin = Math.min(...yPositions);
    const yMax = Math.max(...yPositions);

    // Grid size
    const width = xMax - xMin + 1;
    const height = yMax - yMin + 1;

    return width / height;
};

const getClusterSizeScores = clusters => {

    const clusterSizes = clusters.map(cluster => getClusterSize(cluster));
    const minSize = Math.min(...clusterSizes);
    const maxSize = Math.max(...clusterSizes);

    return clusterSizes.map(size => 1 - normalizeBetween(minSize, maxSize, size));
};

const getClusterRatioScores = (clusters, targetRatio = 1) => {

    const clusterRatios = clusters.map(cluster => getClusterRatio(cluster));
    const clusterRatioDifferences = clusterRatios.map(clusterRatio => Math.abs(clusterRatio - targetRatio));
    const minRatioDifference = Math.min(...clusterRatioDifferences);
    const maxRatioDifference = Math.max(...clusterRatioDifferences);

    return clusterRatioDifferences.map(ratioDifference => 1 - normalizeBetween(minRatioDifference, maxRatioDifference, ratioDifference));
};

const getWeightedSizeAndRatioScores = (sizeWeight, ratioWeight, targetRatio, clusters) => {

    const sizeScores = getClusterSizeScores(clusters);
    const ratioScores = getClusterRatioScores(clusters, targetRatio);

    const weightedSizeScores = sizeScores.map(sizeScore => sizeWeight * sizeScore);
    const weightedRatioScores = ratioScores.map(ratioScore => ratioWeight * ratioScore);

    const weightedSizeAndRatioScores = clusters.map((cluster, index) => {
        const score = weightedSizeScores[index] + weightedRatioScores[index];
        return { cluster, score };
    });

    return weightedSizeAndRatioScores;
};

// SLOTS
const isValidSlotCell = (slotCell, orientation, cluster) => {

    const cellId = slotCell.id;

    if (cluster[cellId] !== undefined) {
        // If cell at position

        if (cluster[cellId].type === 'letter') {
            // If letter at position

            // If it is a matching letter
            if (slotCell.letter === cluster[cellId].letter) {

                let cellBeforeId, cellAfterId;

                if (orientation === 'horizontal') {
                    cellBeforeId = positionToId(slotCell.x - 1, slotCell.y);
                    cellAfterId = positionToId(slotCell.x + 1, slotCell.y);
                } else {
                    cellBeforeId = positionToId(slotCell.x, slotCell.y - 1);
                    cellAfterId = positionToId(slotCell.x, slotCell.y + 1);
                }

                // The cells before and after can not be letters
                return cluster[cellBeforeId]?.letter === undefined && cluster[cellAfterId]?.letter === undefined;
            }
        }

        // If not a letter, or not a matching letter
        return false;

    } else {
        // If no cell at position

        let cellLeftId, cellRightId; // "left and right" as per orientation

        if (orientation === 'horizontal') {
            cellLeftId = positionToId(slotCell.x, slotCell.y - 1);
            cellRightId = positionToId(slotCell.x, slotCell.y + 1);
        } else {
            cellLeftId = positionToId(slotCell.x - 1, slotCell.y);
            cellRightId = positionToId(slotCell.x + 1, slotCell.y);
        }

        // "Left and right" cells can not be letters
        return cluster[cellLeftId]?.letter === undefined && cluster[cellRightId]?.letter === undefined;
    }
};

const isValidSlot = (slot, orientation, cluster) => {

    // Check valid orientation
    if (orientation !== 'horizontal' && orientation !== 'vertical') {
        console.log(`WARNING: Invalid orientation ${orientation} in 'isValidSlotCell'`);
        return false;
    }

    if (orientation === 'horizontal') {
        // Horizontal

        // There can be no letter immediately after the slot
        const cellAfterSlotId = positionToId(slot[slot.length - 1].x + 1, slot[slot.length - 1].y);
        if (cluster[cellAfterSlotId]?.letter !== undefined) return false;

        // Check if every cell is valid
        return slot.every(slotCell => isValidSlotCell(slotCell, orientation, cluster));

    } else {
        // Vertical

        // There can be no letter immediately after the slot
        const cellAfterSlotId = positionToId(slot[slot.length - 1].x, slot[slot.length - 1].y + 1);
        if (cluster[cellAfterSlotId] !== undefined) return false;

        // Check if every cell is valid
        return slot.every(slotCell => isValidSlotCell(slotCell, orientation, cluster));
    }
};

const isSameSlot = (slot1, slot2) => {

    // Check equal length
    if (slot1.length !== slot2.length) {
        console.log(`Length mismatch comparing slots!`);
        return false;
    }

    // Check equal positions
    for (let i = 0; i < slot1.length; i++) {
        // Some position not equal
        if (slot1[i].id !== slot2[i].id) return false;
    }

    // All positions equal
    return true;
};

const getPossibleSlotsForWord = (word, cluster) => {

    const possibleHorizontalSlots = [];
    const possibleVerticalSlots = [];

    // For all letters in the new word
    for (let i = 0; i < word.length; i++) {

        // The current letter
        const wordLetterIndex = i;
        const wordLetter = word.charAt(i);

        // Get all cluster cells matching the current letter
        const clusterCellsWithLetter = Object.values(cluster).filter(cell => cell.letter === wordLetter);

        // For all matching cells in the cluster
        for (let j = 0; j < clusterCellsWithLetter.length; j++) {

            const clusterCell = clusterCellsWithLetter[j];

            // Possible slots
            const horizontalSlot = [{
                type: 'clue',

                x: clusterCell.x - wordLetterIndex - 1,
                y: clusterCell.y,
                id: positionToId(clusterCell.x - wordLetterIndex - 1, clusterCell.y),

                word: word,
                orientation: 'horizontal'
            }];
            const verticalSlot = [{
                type: 'clue',

                x: clusterCell.x,
                y: clusterCell.y - wordLetterIndex - 1,
                id: positionToId(clusterCell.x, clusterCell.y - wordLetterIndex - 1),

                word: word,
                orientation: 'vertical'
            }];

            for (let k = 0; k < word.length; k++) {

                const slotLetter = word.charAt(k);

                const xHorizontal = clusterCell.x - wordLetterIndex + k;
                const yHorizontal = clusterCell.y;

                horizontalSlot.push({
                    type: 'letter',

                    x: xHorizontal,
                    y: yHorizontal,
                    id: positionToId(xHorizontal, yHorizontal),

                    letter: slotLetter
                });

                const xVertical = clusterCell.x;
                const yVertical = clusterCell.y - wordLetterIndex + k;

                verticalSlot.push({
                    type: 'letter',

                    x: xVertical,
                    y: yVertical,
                    id: positionToId(xVertical, yVertical),

                    letter: slotLetter
                });
            }

            // Avoid duplicates
            if (!possibleHorizontalSlots.some(slot => isSameSlot(horizontalSlot, slot))) possibleHorizontalSlots.push(horizontalSlot);
            if (!possibleVerticalSlots.some(slot => isSameSlot(verticalSlot, slot))) possibleVerticalSlots.push(verticalSlot);

        }
    }

    return { possibleHorizontalSlots, possibleVerticalSlots };
};

const getValidSlotsForWord = (newWord, cluster) => {

    // Get all possible slots
    const { possibleHorizontalSlots, possibleVerticalSlots } = getPossibleSlotsForWord(newWord, cluster);

    // Only keep the valid slots
    const validHorizontalSlots = possibleHorizontalSlots.filter(slot => isValidSlot(slot, 'horizontal', cluster));
    const validVerticalSlots = possibleVerticalSlots.filter(slot => isValidSlot(slot, 'vertical', cluster));

    // Return valid slots
    return validHorizontalSlots.concat(validVerticalSlots);
};

const addSlotToCluster = (slot, cluster) => {

    // Add the slot
    for (let i = 0; i < slot.length; i++) {
        const slotCell = slot[i];

        // If cell not in cluster
        if (cluster[slotCell.id] === undefined) {
            cluster[slotCell.id] = slotCell;
        }
    }
};

// CLUSTER
const getClusterGrid = cluster => {

    // All cells and their positions
    const clusterCells = Object.values(cluster);
    const xPositions = clusterCells.map(cell => cell.x);
    const yPositions = clusterCells.map(cell => cell.y);

    // Boundaries
    const xMin = Math.min(...xPositions);
    const xMax = Math.max(...xPositions);
    const yMin = Math.min(...yPositions);
    const yMax = Math.max(...yPositions);

    // Grid size
    const width = xMax - xMin + 1;
    const height = yMax - yMin + 1;

    // Offset from origo
    const xOffset = -xMin;
    const yOffset = -yMin;

    // Create empty grid
    const clusterGrid = [];
    for (let i = 0; i < height; i++) {
        const row = [];
        for (let j = 0; j < width; j++) {
            row.push(undefined);
        }
        clusterGrid.push(row);
    }

    // Populate the empty grid with the cluster cells
    clusterCells.forEach(cell => {
        clusterGrid[cell.y + yOffset][cell.x + xOffset] = cell;
    });

    // Return the grid
    return clusterGrid;
};

const positionToId = (x, y) => {
    return `${x},${y}`;
};

const getFirstClusters = firstWord => {

    // The two first clusters
    const horizontalCluster = {};
    const verticalCluster = {};

    // Create the first slots
    // Possible slots
    const horizontalSlot = [{
        type: 'clue',

        x: 0,
        y: 0,
        id: positionToId(0, 0),

        word: firstWord,
        wordId: '42', // TO BE ADDED
        orientation: 'horizontal'
    }];
    const verticalSlot = [{
        type: 'clue',

        x: 0,
        y: 0,
        id: positionToId(0, 0),

        word: firstWord,
        wordId: '42', // TO BE ADDED
        orientation: 'vertical'
    }];

    for (let i = 0; i < firstWord.length; i++) {

        const letter = firstWord.charAt(i);

        // Start at (0,1) and move in the positive x direction
        horizontalSlot.push({
            type: 'letter',

            x: i + 1,
            y: 0,
            id: positionToId(i + 1, 0),

            letter: letter
        });

        // Start at (1,0) and move in the positive y direction
        verticalSlot.push({
            type: 'letter',

            x: 0,
            y: i + 1,
            id: positionToId(0, i + 1),

            letter: letter
        });
    }

    // Add slots to their respective (empty) clusters
    addSlotToCluster(horizontalSlot, horizontalCluster);
    addSlotToCluster(verticalSlot, verticalCluster);

    // Return the two first clusters
    return [horizontalCluster, verticalCluster];
};

const oneShotRandomCluster = words => {

    // Make sure there are words
    if (words.length < 1) return -1;

    // Pick first word at random
    const firstWord = words.splice(randIntBetween(0, words.length - 1), 1)[0];

    // The two clusters for this word
    const firstClusters = getFirstClusters(firstWord);

    // Pick one of the two clusters randomly
    const cluster = firstClusters[randIntBetween(0, 1)];

    // While words left to add
    while (words.length > 0) {

        // Pick next word at random
        const nextWord = words.splice(randIntBetween(0, words.length - 1), 1)[0];

        // Get valid slots for the word
        const validSlotsForWord = getValidSlotsForWord(nextWord, cluster);

        // If no valid slots, one-shotting failed, return -1
        if (validSlotsForWord.length === 0) return -1;

        // Pick valid slot at random
        const randomValidSlot = validSlotsForWord[randIntBetween(0, validSlotsForWord.length - 1)];

        // Add it to the cluster
        addSlotToCluster(randomValidSlot, cluster);
    }

    // Return cluster
    return cluster;
};

const nShotRandomClusters = (n, words) => {

    let randomClusters = [];

    // Try to one-shot a cluster n times
    for (let i = 0; i < n; i++) {

        // Make a copy of the words
        const wordsCopy = words.slice(0);

        // One-shot a cluster
        const cluster = oneShotRandomCluster(wordsCopy);

        // If successful, add it
        if (cluster !== -1) randomClusters.push(cluster);
    }

    // Return found clusters
    return randomClusters;
};

const getBestCluster = (words, sizeWeight = 0.5, ratioWeight = 0.5, targetRatio = 0.5, n = 50) => {

    // Get clusters by one-shotting n times
    const clusters = nShotRandomClusters(n, words);

    if (clusters.length < 1) return -1;

    // Get the weighted scores of the clusters
    const weightedScores = getWeightedSizeAndRatioScores(sizeWeight, ratioWeight, targetRatio, clusters);

    // Get the best score and its index
    const bestScore = Math.max(...weightedScores.map(weightedScore => weightedScore.score));
    const bestScoreIndex = weightedScores.findIndex(weightedScore => weightedScore.score === bestScore);

    // Get the best cluster
    const bestCluster = weightedScores[bestScoreIndex].cluster;

    return bestCluster;
};