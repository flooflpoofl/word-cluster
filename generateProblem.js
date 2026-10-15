const getSemiRandomAddition = (maxOperand, maxSolution) => {

    if ( maxSolution < maxOperand ) maxOperand = maxSolution;

    // Get operands semi randomly
    const firstOperand = randIntBetween(0, maxOperand);
    const secondOperand = randIntBetween(0, Math.min(maxOperand, maxSolution - firstOperand));

    const operandPair = [firstOperand, secondOperand];
    const operator = '+';
    const solution = firstOperand + secondOperand;

    return { operands: operandPair, operators: [operator], solution };
};

const getSemiRandomSubtraction = (maxOperand, maxSolution) => {

    // Get operands randomly
    const firstOperand = randIntBetween(0, maxOperand);
    const secondOperand = randIntBetween(
        Math.max(0, firstOperand - maxSolution),
        Math.min(maxOperand, firstOperand + maxSolution)
    );

    // Order operands so that the solution becomes positive
    const operandPair = firstOperand >= secondOperand ? [firstOperand, secondOperand] : [secondOperand, firstOperand];
    const operator = '-';
    const solution = operandPair[0] - operandPair[1];

    return { operands: operandPair, operators: [operator], solution };
};

const getSemiRandomMultiplication = (maxOperand, maxSolution) => {

    if ( maxSolution < maxOperand ) maxOperand = maxSolution;

    // Get operands semi randomly
    const firstOperand = randIntBetween(1, Math.floor(Math.sqrt(maxOperand)));
    const secondOperand = randIntBetween(1, Math.floor(maxSolution/firstOperand));

    // Order operands randomly
    const operandPair = Math.random() > 0.5 ? [firstOperand, secondOperand] : [secondOperand, firstOperand];
    const operator = 'x';
    const solution = operandPair[0] * operandPair[1];

    return { operands: operandPair, operators: [operator], solution };
};

const getSemiRandomDivision = (maxOperand, maxSolution) => {

    // Get a random multiplication
    const randomMultiplication = getSemiRandomMultiplication(maxOperand, maxSolution);
    // Get a division from the multiplication
    const solution = randomMultiplication.operands[0];
    const firstOperand = randomMultiplication.solution;
    const secondOperand = randomMultiplication.operands[1];

    const operandPair = [firstOperand, secondOperand];
    const operator = '/';

    return { operands: operandPair, operators: [operator], solution };
};

const getSemiRandomOneOperatorProblem = (maxOperand, maxSolution) => {

    // Get a random operation
    const randomOperator = randFromArray(['+', '-', 'x', '/']);

    if (randomOperator === '+') return getSemiRandomAddition(maxOperand, maxSolution);
    if (randomOperator === '-') return getSemiRandomSubtraction(maxOperand, maxSolution);
    if (randomOperator === 'x') return getSemiRandomMultiplication(maxOperand, maxSolution);
    if (randomOperator === '/') return getSemiRandomDivision(maxOperand, maxSolution);
};

const getSemiRandomTwoOperatorProblem = (maxOperand, maxSolution) => {
    
    // Get a random one operator problem
    const {
        operands: randomProblemOperandPair,
        operators: randomProblemOperator,
        solution: randomProblemSolution } = getSemiRandomOneOperatorProblem(maxOperand, maxSolution);
    
    let operandTriplet, operatorPair, solution;
    let constantMax, constantValue;

    // Addition or subtraction for the second operation
    // (no additional multiplication or divison)
    if (Math.random() > 0.5) {
        // Addition
        constantMax = maxSolution - randomProblemSolution;
        constantValue = randIntBetween(0, constantMax);

        // Constant or random problem first
        if (Math.random() > 0.5) {
            operandTriplet = [constantValue, randomProblemOperandPair[0], randomProblemOperandPair[1]];
            operatorPair = ['+', randomProblemOperator[0]];
        } else {
            operandTriplet = [randomProblemOperandPair[0], randomProblemOperandPair[1], constantValue];
            operatorPair = [randomProblemOperator[0], '+'];
        }

        solution = constantValue + randomProblemSolution;

    } else {
        // Subtraction

        // If addition or subtraction in random problem
        // Lead with the random problem in order to avoid parenthesis
        if (randomProblemOperator[0] === '+' || randomProblemOperator[0] === '-') {

            constantValue = randIntBetween(0, randomProblemSolution);

            operandTriplet = [randomProblemOperandPair[0], randomProblemOperandPair[1], constantValue];
            operatorPair = [randomProblemOperator[0], '-'];
            solution = randomProblemSolution - constantValue;
        } else {
            // If multiplication or division in random problem

            constantValue = randIntBetween(0, maxSolution);

            if (constantValue > randomProblemSolution) {
                operandTriplet = [constantValue, randomProblemOperandPair[0], randomProblemOperandPair[1]];
                operatorPair = ['-', randomProblemOperator[0]];
                solution = constantValue - randomProblemSolution;
            } else {
                operandTriplet = [randomProblemOperandPair[0], randomProblemOperandPair[1], constantValue];
                operatorPair = [randomProblemOperator[0], '-'];
                solution = randomProblemSolution - constantValue;
            }
        }
    }

    return { operands: operandTriplet, operators: operatorPair, solution: solution };
};

const generateProblems = (count, maxOperand, maxSolution) => {

    const generatedProblems = [];

    for (let i = 0; i < count; i++) {
        
        let problem;

        // Randomly choose one or two operators
        if (Math.random() > 0.5) {
            problem = getSemiRandomOneOperatorProblem(maxOperand, maxSolution);
        } else {
            problem = getSemiRandomTwoOperatorProblem(maxOperand, maxSolution);
        }

        generatedProblems.push(problem);
    }

    return generatedProblems;
};

const getProblemString = problem => {
    
    // Get the operands and operators from the problem
    const { operands, operators, _ } = problem;

    // Build the string
    let problemString = '';
    for (let i = 0; i < operands.length - 1; i++) {
        problemString += `${operands[i]} ${operators[i]} `;
    }
    // Add the last operand
    problemString += `${operands[operands.length - 1]}`;

    return problemString;
};