/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 */
import mxHierarchicalLayoutStage from "./mxHierarchicalLayoutStage";

class mxCoordinateAssignment extends mxHierarchicalLayoutStage {
  /**
   * Variable: layout
   *
   * Reference to the enclosing <mxHierarchicalLayout>.
   */
  layout = null;

  /**
   * Variable: intraCellSpacing
   *
   * The minimum buffer between cells on the same rank. Default is 30.
   */
  intraCellSpacing = 30;

  /**
   * Variable: interRankCellSpacing
   *
   * The minimum distance between cells on adjacent ranks. Default is 100.
   */
  interRankCellSpacing = 100;

  /**
   * Variable: parallelEdgeSpacing
   *
   * The distance between each parallel edge on each ranks for long edges.
   * Default is 10.
   */
  parallelEdgeSpacing = 10;

  /**
   * Variable: maxIterations
   *
   * The number of heuristic iterations to run. Default is 8.
   */
  maxIterations = 8;

  /**
   * Variable: prefHozEdgeSep
   *
   * The preferred horizontal distance between edges exiting a vertex Default is 5.
   */
  prefHozEdgeSep = 5;

  /**
   * Variable: prefVertEdgeOff
   *
   * The preferred vertical offset between edges exiting a vertex Default is 2.
   */
  prefVertEdgeOff = 2;

  /**
   * Variable: minEdgeJetty
   *
   * The minimum distance for an edge jetty from a vertex Default is 12.
   */
  minEdgeJetty = 12;

  /**
   * Variable: channelBuffer
   *
   * The size of the vertical buffer in the center of inter-rank channels
   * where edge control points should not be placed Default is 4.
   */
  channelBuffer = 4;

  /**
   * Variable: jettyPositions
   *
   * Map of internal edges and (x,y) pair of positions of the start and end jetty
   * for that edge where it connects to the source and target vertices.
   * Note this should technically be a WeakHashMap, but since JS does not
   * have an equivalent, housekeeping must be performed before using.
   * i.e. check all edges are still in the model and clear the values.
   * Note that the y co-ord is the offset of the jetty, not the
   * absolute point
   */
  jettyPositions = null;

  /**
   * Variable: orientation
   *
   * The position of the root ( start ) node(s) relative to the rest of the
   * laid out graph. Default is <mxConstants.DIRECTION_NORTH>.
   */
  orientation = mxConstants.DIRECTION_NORTH;

  /**
   * Variable: initialX
   *
   * The minimum x position node placement starts at
   */
  initialX = null;

  /**
   * Variable: limitX
   *
   * The maximum x value this positioning lays up to
   */
  limitX = null;

  /**
   * Variable: currentXDelta
   *
   * The sum of x-displacements for the current iteration
   */
  currentXDelta = null;

  /**
   * Variable: widestRank
   *
   * The rank that has the widest x position
   */
  widestRank = null;

  /**
   * Variable: rankTopY
   *
   * Internal cache of top-most values of Y for each rank
   */
  rankTopY = null;

  /**
   * Variable: rankBottomY
   *
   * Internal cache of bottom-most value of Y for each rank
   */
  rankBottomY = null;

  /**
   * Variable: widestRankValue
   *
   * The X-coordinate of the edge of the widest rank
   */
  widestRankValue = null;

  /**
   * Variable: rankWidths
   *
   * The width of all the ranks
   */
  rankWidths = null;

  /**
   * Variable: rankY
   *
   * The Y-coordinate of all the ranks
   */
  rankY = null;

  /**
   * Variable: fineTuning
   *
   * Whether or not to perform local optimisations and iterate multiple times
   * through the algorithm. Default is true.
   */
  fineTuning = true;

  /**
   * Variable: nextLayerConnectedCache
   *
   * A store of connections to the layer above for speed
   */
  nextLayerConnectedCache = null;

  /**
   * Variable: previousLayerConnectedCache
   *
   * A store of connections to the layer below for speed
   */
  previousLayerConnectedCache = null;

  /**
   * Variable: groupPadding
   *
   * Padding added to resized parents Default is 10.
   */
  groupPadding = 10;

  /**
   * Class: mxCoordinateAssignment
   *
   * Sets the horizontal locations of node and edge dummy nodes on each layer.
   * Uses median down and up weighings as well as heuristics to straighten edges as
   * far as possible.
   *
   * Constructor: mxCoordinateAssignment
   *
   * Creates a coordinate assignment.
   *
   * Arguments:
   *
   * intraCellSpacing - the minimum buffer between cells on the same rank
   * interRankCellSpacing - the minimum distance between cells on adjacent ranks
   * orientation - the position of the root node(s) relative to the graph
   * initialX - the leftmost coordinate node placement starts at
   */
  constructor(layout, intraCellSpacing, interRankCellSpacing,
              orientation, initialX, parallelEdgeSpacing) {
    super();

    this.layout = layout;
    this.intraCellSpacing = intraCellSpacing;
    this.interRankCellSpacing = interRankCellSpacing;
    this.orientation = orientation;
    this.initialX = initialX;
    this.parallelEdgeSpacing = parallelEdgeSpacing;
  };

  /**
   * Utility method to display current positions
   */
  printStatus = () => {
    let model = this.layout.getModel();
    mxLog.show();

    mxLog.writeln('======Coord assignment debug=======');

    for (let j = 0; j < model.ranks.length; j++) {
      mxLog.write('Rank ', j, ' : ');
      let rank = model.ranks[j];

      for (let k = 0; k < rank.length; k++) {
        let cell = rank[k];

        mxLog.write(cell.getGeneralPurposeVariable(j), '  ');
      }
      mxLog.writeln();
    }

    mxLog.writeln('====================================');
  };

  /**
   * Function: execute
   *
   * A basic horizontal coordinate assignment algorithm
   */
  execute = (parent) => {
    this.jettyPositions = Object();
    let model = this.layout.getModel();
    this.currentXDelta = 0.0;

    this.initialCoords(this.layout.getGraph(), model);

//  this.printStatus();

    if (this.fineTuning) {
      this.minNode(model);
    }

    let bestXDelta = 100000000.0;

    if (this.fineTuning) {
      for (let i = 0; i < this.maxIterations; i++) {
//      this.printStatus();

        // Median Heuristic
        if (i != 0) {
          this.medianPos(i, model);
          this.minNode(model);
        }

        // if the total offset is less for the current positioning,
        // there are less heavily angled edges and so the current
        // positioning is used
        if (this.currentXDelta < bestXDelta) {
          for (let j = 0; j < model.ranks.length; j++) {
            let rank = model.ranks[j];

            for (let k = 0; k < rank.length; k++) {
              let cell = rank[k];
              cell.setX(j, cell.getGeneralPurposeVariable(j));
            }
          }

          bestXDelta = this.currentXDelta;
        } else {
          // Restore the best positions
          for (let j = 0; j < model.ranks.length; j++) {
            let rank = model.ranks[j];

            for (let k = 0; k < rank.length; k++) {
              let cell = rank[k];
              cell.setGeneralPurposeVariable(j, cell.getX(j));
            }
          }
        }

        this.minPath(this.layout.getGraph(), model);

        this.currentXDelta = 0;
      }
    }

    this.setCellLocations(this.layout.getGraph(), model);
  };

  /**
   * Function: minNode
   *
   * Performs one median positioning sweep in both directions
   */
  minNode = (model) => {
    // Queue all nodes
    let nodeList = [];

    // Need to be able to map from cell to cellWrapper
    let map = new mxDictionary();
    let rank = [];

    for (let i = 0; i <= model.maxRank; i++) {
      rank[i] = model.ranks[i];

      for (let j = 0; j < rank[i].length; j++) {
        // Use the weight to store the rank and visited to store whether
        // or not the cell is in the list
        let node = rank[i][j];
        let nodeWrapper = new WeightedCellSorter(node, i);
        nodeWrapper.rankIndex = j;
        nodeWrapper.visited = true;
        nodeList.push(nodeWrapper);

        map.put(node, nodeWrapper);
      }
    }

    // Set a limit of the maximum number of times we will access the queue
    // in case a loop appears
    let maxTries = nodeList.length * 10;
    let count = 0;

    // Don't move cell within this value of their median
    let tolerance = 1;

    while (nodeList.length > 0 && count <= maxTries) {
      let cellWrapper = nodeList.shift();
      let cell = cellWrapper.cell;

      let rankValue = cellWrapper.weightedValue;
      let rankIndex = parseInt(cellWrapper.rankIndex);

      let nextLayerConnectedCells = cell.getNextLayerConnectedCells(rankValue);
      let previousLayerConnectedCells = cell.getPreviousLayerConnectedCells(rankValue);

      let numNextLayerConnected = nextLayerConnectedCells.length;
      let numPreviousLayerConnected = previousLayerConnectedCells.length;

      let medianNextLevel = this.medianXValue(nextLayerConnectedCells,
          rankValue + 1);
      let medianPreviousLevel = this.medianXValue(previousLayerConnectedCells,
          rankValue - 1);

      let numConnectedNeighbours = numNextLayerConnected
          + numPreviousLayerConnected;
      let currentPosition = cell.getGeneralPurposeVariable(rankValue);
      let cellMedian = currentPosition;

      if (numConnectedNeighbours > 0) {
        cellMedian = (medianNextLevel * numNextLayerConnected + medianPreviousLevel
            * numPreviousLayerConnected)
            / numConnectedNeighbours;
      }

      // Flag storing whether or not position has changed
      let positionChanged = false;

      if (cellMedian < currentPosition - tolerance) {
        if (rankIndex == 0) {
          cell.setGeneralPurposeVariable(rankValue, cellMedian);
          positionChanged = true;
        } else {
          let leftCell = rank[rankValue][rankIndex - 1];
          let leftLimit = leftCell
              .getGeneralPurposeVariable(rankValue);
          leftLimit = leftLimit + leftCell.width / 2
              + this.intraCellSpacing + cell.width / 2;

          if (leftLimit < cellMedian) {
            cell.setGeneralPurposeVariable(rankValue, cellMedian);
            positionChanged = true;
          } else if (leftLimit < cell
                  .getGeneralPurposeVariable(rankValue)
              - tolerance) {
            cell.setGeneralPurposeVariable(rankValue, leftLimit);
            positionChanged = true;
          }
        }
      } else if (cellMedian > currentPosition + tolerance) {
        let rankSize = rank[rankValue].length;

        if (rankIndex == rankSize - 1) {
          cell.setGeneralPurposeVariable(rankValue, cellMedian);
          positionChanged = true;
        } else {
          let rightCell = rank[rankValue][rankIndex + 1];
          let rightLimit = rightCell
              .getGeneralPurposeVariable(rankValue);
          rightLimit = rightLimit - rightCell.width / 2
              - this.intraCellSpacing - cell.width / 2;

          if (rightLimit > cellMedian) {
            cell.setGeneralPurposeVariable(rankValue, cellMedian);
            positionChanged = true;
          } else if (rightLimit > cell
                  .getGeneralPurposeVariable(rankValue)
              + tolerance) {
            cell.setGeneralPurposeVariable(rankValue, rightLimit);
            positionChanged = true;
          }
        }
      }

      if (positionChanged) {
        // Add connected nodes to map and list
        for (let i = 0; i < nextLayerConnectedCells.length; i++) {
          let connectedCell = nextLayerConnectedCells[i];
          let connectedCellWrapper = map.get(connectedCell);

          if (connectedCellWrapper != null) {
            if (connectedCellWrapper.visited == false) {
              connectedCellWrapper.visited = true;
              nodeList.push(connectedCellWrapper);
            }
          }
        }

        // Add connected nodes to map and list
        for (let i = 0; i < previousLayerConnectedCells.length; i++) {
          let connectedCell = previousLayerConnectedCells[i];
          let connectedCellWrapper = map.get(connectedCell);

          if (connectedCellWrapper != null) {
            if (connectedCellWrapper.visited == false) {
              connectedCellWrapper.visited = true;
              nodeList.push(connectedCellWrapper);
            }
          }
        }
      }

      cellWrapper.visited = false;
      count++;
    }
  };

  /**
   * Function: medianPos
   *
   * Performs one median positioning sweep in one direction
   *
   * Parameters:
   *
   * i - the iteration of the whole process
   * model - an internal model of the hierarchical layout
   */
  medianPos = (i, model) => {
    // Reverse sweep direction each time through this method
    let downwardSweep = (i % 2 == 0);

    if (downwardSweep) {
      for (let j = model.maxRank; j > 0; j--) {
        this.rankMedianPosition(j - 1, model, j);
      }
    } else {
      for (let j = 0; j < model.maxRank - 1; j++) {
        this.rankMedianPosition(j + 1, model, j);
      }
    }
  };

  /**
   * Function: rankMedianPosition
   *
   * Performs median minimisation over one rank.
   *
   * Parameters:
   *
   * rankValue - the layer number of this rank
   * model - an internal model of the hierarchical layout
   * nextRankValue - the layer number whose connected cels are to be laid out
   * relative to
   */
  rankMedianPosition = (rankValue, model, nextRankValue) => {
    let rank = model.ranks[rankValue];

    // Form an array of the order in which the cell are to be processed
    // , the order is given by the weighted sum of the in or out edges,
    // depending on whether we're traveling up or down the hierarchy.
    let weightedValues = [];
    let cellMap = {};

    for (let i = 0; i < rank.length; i++) {
      let currentCell = rank[i];
      weightedValues[i] = new WeightedCellSorter();
      weightedValues[i].cell = currentCell;
      weightedValues[i].rankIndex = i;
      cellMap[currentCell.id] = weightedValues[i];
      let nextLayerConnectedCells = null;

      if (nextRankValue < rankValue) {
        nextLayerConnectedCells = currentCell
            .getPreviousLayerConnectedCells(rankValue);
      } else {
        nextLayerConnectedCells = currentCell
            .getNextLayerConnectedCells(rankValue);
      }

      // Calculate the weighing based on this node type and those this
      // node is connected to on the next layer
      weightedValues[i].weightedValue = this.calculatedWeightedValue(
          currentCell, nextLayerConnectedCells);
    }

    weightedValues.sort(compare);

    // Set the new position of each node within the rank using
    // its temp variable

    for (let i = 0; i < weightedValues.length; i++) {
      let numConnectionsNextLevel = 0;
      let cell = weightedValues[i].cell;
      let nextLayerConnectedCells = null;
      let medianNextLevel = 0;

      if (nextRankValue < rankValue) {
        nextLayerConnectedCells = cell.getPreviousLayerConnectedCells(
            rankValue).slice();
      } else {
        nextLayerConnectedCells = cell.getNextLayerConnectedCells(
            rankValue).slice();
      }

      if (nextLayerConnectedCells != null) {
        numConnectionsNextLevel = nextLayerConnectedCells.length;

        if (numConnectionsNextLevel > 0) {
          medianNextLevel = this.medianXValue(nextLayerConnectedCells,
              nextRankValue);
        } else {
          // For case of no connections on the next level set the
          // median to be the current position and try to be
          // positioned there
          medianNextLevel = cell.getGeneralPurposeVariable(rankValue);
        }
      }

      let leftBuffer = 0.0;
      let leftLimit = -100000000.0;

      for (let j = weightedValues[i].rankIndex - 1; j >= 0;) {
        let weightedValue = cellMap[rank[j].id];

        if (weightedValue != null) {
          let leftCell = weightedValue.cell;

          if (weightedValue.visited) {
            // The left limit is the right hand limit of that
            // cell plus any allowance for unallocated cells
            // in-between
            leftLimit = leftCell
                    .getGeneralPurposeVariable(rankValue)
                + leftCell.width
                / 2.0
                + this.intraCellSpacing
                + leftBuffer + cell.width / 2.0;
            j = -1;
          } else {
            leftBuffer += leftCell.width + this.intraCellSpacing;
            j--;
          }
        }
      }

      let rightBuffer = 0.0;
      let rightLimit = 100000000.0;

      for (let j = weightedValues[i].rankIndex + 1; j < weightedValues.length;) {
        let weightedValue = cellMap[rank[j].id];

        if (weightedValue != null) {
          let rightCell = weightedValue.cell;

          if (weightedValue.visited) {
            // The left limit is the right hand limit of that
            // cell plus any allowance for unallocated cells
            // in-between
            rightLimit = rightCell
                    .getGeneralPurposeVariable(rankValue)
                - rightCell.width
                / 2.0
                - this.intraCellSpacing
                - rightBuffer - cell.width / 2.0;
            j = weightedValues.length;
          } else {
            rightBuffer += rightCell.width + this.intraCellSpacing;
            j++;
          }
        }
      }

      if (medianNextLevel >= leftLimit && medianNextLevel <= rightLimit) {
        cell.setGeneralPurposeVariable(rankValue, medianNextLevel);
      } else if (medianNextLevel < leftLimit) {
        // Couldn't place at median value, place as close to that
        // value as possible
        cell.setGeneralPurposeVariable(rankValue, leftLimit);
        this.currentXDelta += leftLimit - medianNextLevel;
      } else if (medianNextLevel > rightLimit) {
        // Couldn't place at median value, place as close to that
        // value as possible
        cell.setGeneralPurposeVariable(rankValue, rightLimit);
        this.currentXDelta += medianNextLevel - rightLimit;
      }

      weightedValues[i].visited = true;
    }
  };

  /**
   * Function: calculatedWeightedValue
   *
   * Calculates the priority the specified cell has based on the type of its
   * cell and the cells it is connected to on the next layer
   *
   * Parameters:
   *
   * currentCell - the cell whose weight is to be calculated
   * collection - the cells the specified cell is connected to
   */
  calculatedWeightedValue = (currentCell, collection) => {
    let totalWeight = 0;

    for (let i = 0; i < collection.length; i++) {
      let cell = collection[i];

      if (currentCell.isVertex() && cell.isVertex()) {
        totalWeight++;
      } else if (currentCell.isEdge() && cell.isEdge()) {
        totalWeight += 8;
      } else {
        totalWeight += 2;
      }
    }

    return totalWeight;
  };

  /**
   * Function: medianXValue
   *
   * Calculates the median position of the connected cell on the specified
   * rank
   *
   * Parameters:
   *
   * connectedCells - the cells the candidate connects to on this level
   * rankValue - the layer number of this rank
   */
  medianXValue = (connectedCells, rankValue) => {
    if (connectedCells.length == 0) {
      return 0;
    }

    let medianValues = [];

    for (let i = 0; i < connectedCells.length; i++) {
      medianValues[i] = connectedCells[i].getGeneralPurposeVariable(rankValue);
    }

    medianValues.sort((a, b) => {
      return a - b;
    });

    if (connectedCells.length % 2 == 1) {
      // For odd numbers of adjacent vertices return the median
      return medianValues[Math.floor(connectedCells.length / 2)];
    } else {
      let medianPoint = connectedCells.length / 2;
      let leftMedian = medianValues[medianPoint - 1];
      let rightMedian = medianValues[medianPoint];

      return ((leftMedian + rightMedian) / 2);
    }
  };

  /**
   * Function: initialCoords
   *
   * Sets up the layout in an initial positioning. The ranks are all centered
   * as much as possible along the middle vertex in each rank. The other cells
   * are then placed as close as possible on either side.
   *
   * Parameters:
   *
   * facade - the facade describing the input graph
   * model - an internal model of the hierarchical layout
   */
  initialCoords = (facade, model) => {
    this.calculateWidestRank(facade, model);

    // Sweep up and down from the widest rank
    for (let i = this.widestRank; i >= 0; i--) {
      if (i < model.maxRank) {
        this.rankCoordinates(i, facade, model);
      }
    }

    for (let i = this.widestRank + 1; i <= model.maxRank; i++) {
      if (i > 0) {
        this.rankCoordinates(i, facade, model);
      }
    }
  };

  /**
   * Function: rankCoordinates
   *
   * Sets up the layout in an initial positioning. All the first cells in each
   * rank are moved to the left and the rest of the rank inserted as close
   * together as their size and buffering permits. This method works on just
   * the specified rank.
   *
   * Parameters:
   *
   * rankValue - the current rank being processed
   * graph - the facade describing the input graph
   * model - an internal model of the hierarchical layout
   */
  rankCoordinates = (rankValue, graph, model) => {
    let rank = model.ranks[rankValue];
    let maxY = 0.0;
    let localX = this.initialX + (this.widestRankValue - this.rankWidths[rankValue])
        / 2;

    // Store whether or not any of the cells' bounds were unavailable so
    // to only issue the warning once for all cells
    let boundsWarning = false;

    for (let i = 0; i < rank.length; i++) {
      let node = rank[i];

      if (node.isVertex()) {
        let bounds = this.layout.getVertexBounds(node.cell);

        if (bounds != null) {
          if (this.orientation == mxConstants.DIRECTION_NORTH ||
              this.orientation == mxConstants.DIRECTION_SOUTH) {
            node.width = bounds.width;
            node.height = bounds.height;
          } else {
            node.width = bounds.height;
            node.height = bounds.width;
          }
        } else {
          boundsWarning = true;
        }

        maxY = Math.max(maxY, node.height);
      } else if (node.isEdge()) {
        // The width is the number of additional parallel edges
        // time the parallel edge spacing
        let numEdges = 1;

        if (node.edges != null) {
          numEdges = node.edges.length;
        } else {
          mxLog.warn('edge.edges is null');
        }

        node.width = (numEdges - 1) * this.parallelEdgeSpacing;
      }

      // Set the initial x-value as being the best result so far
      localX += node.width / 2.0;
      node.setX(rankValue, localX);
      node.setGeneralPurposeVariable(rankValue, localX);
      localX += node.width / 2.0;
      localX += this.intraCellSpacing;
    }

    if (boundsWarning == true) {
      mxLog.warn('At least one cell has no bounds');
    }
  };

  /**
   * Function: calculateWidestRank
   *
   * Calculates the width rank in the hierarchy. Also set the y value of each
   * rank whilst performing the calculation
   *
   * Parameters:
   *
   * graph - the facade describing the input graph
   * model - an internal model of the hierarchical layout
   */
  calculateWidestRank = (graph, model) => {
    // Starting y co-ordinate
    let y = -this.interRankCellSpacing;

    // Track the widest cell on the last rank since the y
    // difference depends on it
    let lastRankMaxCellHeight = 0.0;
    this.rankWidths = [];
    this.rankY = [];

    for (let rankValue = model.maxRank; rankValue >= 0; rankValue--) {
      // Keep track of the widest cell on this rank
      let maxCellHeight = 0.0;
      let rank = model.ranks[rankValue];
      let localX = this.initialX;

      // Store whether or not any of the cells' bounds were unavailable so
      // to only issue the warning once for all cells
      let boundsWarning = false;

      for (let i = 0; i < rank.length; i++) {
        let node = rank[i];

        if (node.isVertex()) {
          let bounds = this.layout.getVertexBounds(node.cell);

          if (bounds != null) {
            if (this.orientation == mxConstants.DIRECTION_NORTH ||
                this.orientation == mxConstants.DIRECTION_SOUTH) {
              node.width = bounds.width;
              node.height = bounds.height;
            } else {
              node.width = bounds.height;
              node.height = bounds.width;
            }
          } else {
            boundsWarning = true;
          }

          maxCellHeight = Math.max(maxCellHeight, node.height);
        } else if (node.isEdge()) {
          // The width is the number of additional parallel edges
          // time the parallel edge spacing
          let numEdges = 1;

          if (node.edges != null) {
            numEdges = node.edges.length;
          } else {
            mxLog.warn('edge.edges is null');
          }

          node.width = (numEdges - 1) * this.parallelEdgeSpacing;
        }

        // Set the initial x-value as being the best result so far
        localX += node.width / 2.0;
        node.setX(rankValue, localX);
        node.setGeneralPurposeVariable(rankValue, localX);
        localX += node.width / 2.0;
        localX += this.intraCellSpacing;

        if (localX > this.widestRankValue) {
          this.widestRankValue = localX;
          this.widestRank = rankValue;
        }

        this.rankWidths[rankValue] = localX;
      }

      if (boundsWarning == true) {
        mxLog.warn('At least one cell has no bounds');
      }

      this.rankY[rankValue] = y;
      let distanceToNextRank = maxCellHeight / 2.0
          + lastRankMaxCellHeight / 2.0 + this.interRankCellSpacing;
      lastRankMaxCellHeight = maxCellHeight;

      if (this.orientation == mxConstants.DIRECTION_NORTH ||
          this.orientation == mxConstants.DIRECTION_WEST) {
        y += distanceToNextRank;
      } else {
        y -= distanceToNextRank;
      }

      for (let i = 0; i < rank.length; i++) {
        let cell = rank[i];
        cell.setY(rankValue, y);
      }
    }
  };

  /**
   * Function: minPath
   *
   * Straightens out chains of virtual nodes where possibleacade to those stored after this layout
   * processing step has completed.
   *
   * Parameters:
   *
   * graph - the facade describing the input graph
   * model - an internal model of the hierarchical layout
   */
  minPath = (graph, model) => {
    // Work down and up each edge with at least 2 control points
    // trying to straighten each one out. If the same number of
    // straight segments are formed in both directions, the
    // preferred direction used is the one where the final
    // control points have the least offset from the connectable
    // region of the terminating vertices
    let edges = model.edgeMapper.getValues();

    for (let j = 0; j < edges.length; j++) {
      let cell = edges[j];

      if (cell.maxRank - cell.minRank - 1 < 1) {
        continue;
      }

      // At least two virtual nodes in the edge
      // Check first whether the edge is already straight
      let referenceX = cell
          .getGeneralPurposeVariable(cell.minRank + 1);
      let edgeStraight = true;
      let refSegCount = 0;

      for (let i = cell.minRank + 2; i < cell.maxRank; i++) {
        let x = cell.getGeneralPurposeVariable(i);

        if (referenceX != x) {
          edgeStraight = false;
          referenceX = x;
        } else {
          refSegCount++;
        }
      }

      if (!edgeStraight) {
        let upSegCount = 0;
        let downSegCount = 0;
        let upXPositions = [];
        let downXPositions = [];

        let currentX = cell.getGeneralPurposeVariable(cell.minRank + 1);

        for (let i = cell.minRank + 1; i < cell.maxRank - 1; i++) {
          // Attempt to straight out the control point on the
          // next segment up with the current control point.
          let nextX = cell.getX(i + 1);

          if (currentX == nextX) {
            upXPositions[i - cell.minRank - 1] = currentX;
            upSegCount++;
          } else if (this.repositionValid(model, cell, i + 1, currentX)) {
            upXPositions[i - cell.minRank - 1] = currentX;
            upSegCount++;
            // Leave currentX at same value
          } else {
            upXPositions[i - cell.minRank - 1] = nextX;
            currentX = nextX;
          }
        }

        currentX = cell.getX(i);

        for (let i = cell.maxRank - 1; i > cell.minRank + 1; i--) {
          // Attempt to straight out the control point on the
          // next segment down with the current control point.
          let nextX = cell.getX(i - 1);

          if (currentX == nextX) {
            downXPositions[i - cell.minRank - 2] = currentX;
            downSegCount++;
          } else if (this.repositionValid(model, cell, i - 1, currentX)) {
            downXPositions[i - cell.minRank - 2] = currentX;
            downSegCount++;
            // Leave currentX at same value
          } else {
            downXPositions[i - cell.minRank - 2] = cell.getX(i - 1);
            currentX = nextX;
          }
        }

        if (downSegCount > refSegCount || upSegCount > refSegCount) {
          if (downSegCount >= upSegCount) {
            // Apply down calculation values
            for (let i = cell.maxRank - 2; i > cell.minRank; i--) {
              cell.setX(i, downXPositions[i - cell.minRank - 1]);
            }
          } else if (upSegCount > downSegCount) {
            // Apply up calculation values
            for (let i = cell.minRank + 2; i < cell.maxRank; i++) {
              cell.setX(i, upXPositions[i - cell.minRank - 2]);
            }
          } else {
            // Neither direction provided a favourable result
            // But both calculations are better than the
            // existing solution, so apply the one with minimal
            // offset to attached vertices at either end.
          }
        }
      }
    }
  };

  /**
   * Function: repositionValid
   *
   * Determines whether or not a node may be moved to the specified x
   * position on the specified rank
   *
   * Parameters:
   *
   * model - the layout model
   * cell - the cell being analysed
   * rank - the layer of the cell
   * position - the x position being sought
   */
  repositionValid = (model, cell, rank, position) => {
    let rankArray = model.ranks[rank];
    let rankIndex = -1;

    for (let i = 0; i < rankArray.length; i++) {
      if (cell == rankArray[i]) {
        rankIndex = i;
        break;
      }
    }

    if (rankIndex < 0) {
      return false;
    }

    let currentX = cell.getGeneralPurposeVariable(rank);

    if (position < currentX) {
      // Trying to move node to the left.
      if (rankIndex == 0) {
        // Left-most node, can move anywhere
        return true;
      }

      let leftCell = rankArray[rankIndex - 1];
      let leftLimit = leftCell.getGeneralPurposeVariable(rank);
      leftLimit = leftLimit + leftCell.width / 2
          + this.intraCellSpacing + cell.width / 2;

      if (leftLimit <= position) {
        return true;
      } else {
        return false;
      }
    } else if (position > currentX) {
      // Trying to move node to the right.
      if (rankIndex == rankArray.length - 1) {
        // Right-most node, can move anywhere
        return true;
      }

      let rightCell = rankArray[rankIndex + 1];
      let rightLimit = rightCell.getGeneralPurposeVariable(rank);
      rightLimit = rightLimit - rightCell.width / 2
          - this.intraCellSpacing - cell.width / 2;

      if (rightLimit >= position) {
        return true;
      } else {
        return false;
      }
    }

    return true;
  };

  /**
   * Function: setCellLocations
   *
   * Sets the cell locations in the facade to those stored after this layout
   * processing step has completed.
   *
   * Parameters:
   *
   * graph - the input graph
   * model - the layout model
   */
  setCellLocations = (graph, model) => {
    this.rankTopY = [];
    this.rankBottomY = [];

    for (let i = 0; i < model.ranks.length; i++) {
      this.rankTopY[i] = Number.MAX_VALUE;
      this.rankBottomY[i] = -Number.MAX_VALUE;
    }

    let vertices = model.vertexMapper.getValues();

    // Process vertices all first, since they define the lower and
    // limits of each rank. Between these limits lie the channels
    // where the edges can be routed across the graph

    for (let i = 0; i < vertices.length; i++) {
      this.setVertexLocation(vertices[i]);
    }

    // Post process edge styles. Needs the vertex locations set for initial
    // values of the top and bottoms of each rank
    if (this.layout.edgeStyle == mxHierarchicalEdgeStyle.ORTHOGONAL
        || this.layout.edgeStyle == mxHierarchicalEdgeStyle.POLYLINE
        || this.layout.edgeStyle == mxHierarchicalEdgeStyle.CURVE) {
      this.localEdgeProcessing(model);
    }

    let edges = model.edgeMapper.getValues();

    for (let i = 0; i < edges.length; i++) {
      this.setEdgePosition(edges[i]);
    }
  };

  /**
   * Function: localEdgeProcessing
   *
   * Separates the x position of edges as they connect to vertices
   *
   * Parameters:
   *
   * model - the layout model
   */
  localEdgeProcessing = (model) => {
    // Iterate through each vertex, look at the edges connected in
    // both directions.
    for (let rankIndex = 0; rankIndex < model.ranks.length; rankIndex++) {
      let rank = model.ranks[rankIndex];

      for (let cellIndex = 0; cellIndex < rank.length; cellIndex++) {
        let cell = rank[cellIndex];

        if (cell.isVertex()) {
          let currentCells = cell.getPreviousLayerConnectedCells(rankIndex);

          let currentRank = rankIndex - 1;

          // Two loops, last connected cells, and next
          for (let k = 0; k < 2; k++) {
            if (currentRank > -1
                && currentRank < model.ranks.length
                && currentCells != null
                && currentCells.length > 0) {
              let sortedCells = [];

              for (let j = 0; j < currentCells.length; j++) {
                let sorter = new WeightedCellSorter(
                    currentCells[j], currentCells[j].getX(currentRank));
                sortedCells.push(sorter);
              }

              sortedCells.sort(compare);

              let leftLimit = cell.x[0] - cell.width / 2;
              let rightLimit = leftLimit + cell.width;

              // Connected edge count starts at 1 to allow for buffer
              // with edge of vertex
              let connectedEdgeCount = 0;
              let connectedEdgeGroupCount = 0;
              let connectedEdges = [];
              // Calculate width requirements for all connected edges
              for (let j = 0; j < sortedCells.length; j++) {
                let innerCell = sortedCells[j].cell;
                var connections;

                if (innerCell.isVertex()) {
                  // Get the connecting edge
                  if (k == 0) {
                    connections = cell.connectsAsSource;

                  } else {
                    connections = cell.connectsAsTarget;
                  }

                  for (let connIndex = 0; connIndex < connections.length; connIndex++) {
                    if (connections[connIndex].source == innerCell
                        || connections[connIndex].target == innerCell) {
                      connectedEdgeCount += connections[connIndex].edges
                          .length;
                      connectedEdgeGroupCount++;

                      connectedEdges.push(connections[connIndex]);
                    }
                  }
                } else {
                  connectedEdgeCount += innerCell.edges.length;
                  connectedEdgeGroupCount++;
                  connectedEdges.push(innerCell);
                }
              }

              let requiredWidth = (connectedEdgeCount + 1)
                  * this.prefHozEdgeSep;

              // Add a buffer on the edges of the vertex if the edge count allows
              if (cell.width > requiredWidth
                  + (2 * this.prefHozEdgeSep)) {
                leftLimit += this.prefHozEdgeSep;
                rightLimit -= this.prefHozEdgeSep;
              }

              let availableWidth = rightLimit - leftLimit;
              let edgeSpacing = availableWidth / connectedEdgeCount;

              let currentX = leftLimit + edgeSpacing / 2.0;
              let currentYOffset = this.minEdgeJetty - this.prefVertEdgeOff;
              let maxYOffset = 0;

              for (let j = 0; j < connectedEdges.length; j++) {
                let numActualEdges = connectedEdges[j].edges
                    .length;
                let pos = this.jettyPositions[connectedEdges[j].ids[0]];

                if (pos == null) {
                  pos = [];
                  this.jettyPositions[connectedEdges[j].ids[0]] = pos;
                }

                if (j < connectedEdgeCount / 2) {
                  currentYOffset += this.prefVertEdgeOff;
                } else if (j > connectedEdgeCount / 2) {
                  currentYOffset -= this.prefVertEdgeOff;
                }
                // Ignore the case if equals, this means the second of 2
                // jettys with the same y (even number of edges)

                for (let m = 0; m < numActualEdges; m++) {
                  pos[m * 4 + k * 2] = currentX;
                  currentX += edgeSpacing;
                  pos[m * 4 + k * 2 + 1] = currentYOffset;
                }

                maxYOffset = Math.max(maxYOffset,
                    currentYOffset);
              }
            }

            currentCells = cell.getNextLayerConnectedCells(rankIndex);

            currentRank = rankIndex + 1;
          }
        }
      }
    }
  };

  /**
   * Function: setEdgePosition
   *
   * Fixes the control points
   */
  setEdgePosition = (cell) => {
    // For parallel edges we need to seperate out the points a
    // little
    let offsetX = 0;
    // Only set the edge control points once

    if (cell.temp[0] != 101207) {
      let maxRank = cell.maxRank;
      let minRank = cell.minRank;

      if (maxRank == minRank) {
        maxRank = cell.source.maxRank;
        minRank = cell.target.minRank;
      }

      let parallelEdgeCount = 0;
      let jettys = this.jettyPositions[cell.ids[0]];

      let source = cell.isReversed ? cell.target.cell : cell.source.cell;
      let graph = this.layout.graph;
      let layoutReversed = this.orientation == mxConstants.DIRECTION_EAST
          || this.orientation == mxConstants.DIRECTION_SOUTH;

      for (let i = 0; i < cell.edges.length; i++) {
        let realEdge = cell.edges[i];
        let realSource = this.layout.getVisibleTerminal(realEdge, true);

        //List oldPoints = graph.getPoints(realEdge);
        let newPoints = [];

        // Single length reversed edges end up with the jettys in the wrong
        // places. Since single length edges only have jettys, not segment
        // control points, we just say the edge isn't reversed in this section
        let reversed = cell.isReversed;

        if (realSource != source) {
          // The real edges include all core model edges and these can go
          // in both directions. If the source of the hierarchical model edge
          // isn't the source of the specific real edge in this iteration
          // treat if as reversed
          reversed = !reversed;
        }

        // First jetty of edge
        if (jettys != null) {
          let arrayOffset = reversed ? 2 : 0;
          let y = reversed ?
              (layoutReversed ? this.rankBottomY[minRank] : this.rankTopY[minRank]) :
              (layoutReversed ? this.rankTopY[maxRank] : this.rankBottomY[maxRank]);
          let jetty = jettys[parallelEdgeCount * 4 + 1 + arrayOffset];

          if (reversed != layoutReversed) {
            jetty = -jetty;
          }

          y += jetty;
          let x = jettys[parallelEdgeCount * 4 + arrayOffset];

          let modelSource = graph.model.getTerminal(realEdge, true);

          if (this.layout.isPort(modelSource) && graph.model.getParent(modelSource) == realSource) {
            let state = graph.view.getState(modelSource);

            if (state != null) {
              x = state.x;
            } else {
              x = realSource.geometry.x + cell.source.width * modelSource.geometry.x;
            }
          }

          if (this.orientation == mxConstants.DIRECTION_NORTH
              || this.orientation == mxConstants.DIRECTION_SOUTH) {
            newPoints.push(new mxPoint(x, y));

            if (this.layout.edgeStyle == mxHierarchicalEdgeStyle.CURVE) {
              newPoints.push(new mxPoint(x, y + jetty));
            }
          } else {
            newPoints.push(new mxPoint(y, x));

            if (this.layout.edgeStyle == mxHierarchicalEdgeStyle.CURVE) {
              newPoints.push(new mxPoint(y + jetty, x));
            }
          }
        }

        // Declare variables to define loop through edge points and
        // change direction if edge is reversed

        let loopStart = cell.x.length - 1;
        let loopLimit = -1;
        let loopDelta = -1;
        let currentRank = cell.maxRank - 1;

        if (reversed) {
          loopStart = 0;
          loopLimit = cell.x.length;
          loopDelta = 1;
          currentRank = cell.minRank + 1;
        }
        // Reversed edges need the points inserted in
        // reverse order
        for (let j = loopStart; (cell.maxRank != cell.minRank) && j != loopLimit; j += loopDelta) {
          // The horizontal position in a vertical layout
          let positionX = cell.x[j] + offsetX;

          // Work out the vertical positions in a vertical layout
          // in the edge buffer channels above and below this rank
          let topChannelY = (this.rankTopY[currentRank] + this.rankBottomY[currentRank + 1]) / 2.0;
          let bottomChannelY = (this.rankTopY[currentRank - 1] + this.rankBottomY[currentRank]) / 2.0;

          if (reversed) {
            let tmp = topChannelY;
            topChannelY = bottomChannelY;
            bottomChannelY = tmp;
          }

          if (this.orientation == mxConstants.DIRECTION_NORTH ||
              this.orientation == mxConstants.DIRECTION_SOUTH) {
            newPoints.push(new mxPoint(positionX, topChannelY));
            newPoints.push(new mxPoint(positionX, bottomChannelY));
          } else {
            newPoints.push(new mxPoint(topChannelY, positionX));
            newPoints.push(new mxPoint(bottomChannelY, positionX));
          }

          this.limitX = Math.max(this.limitX, positionX);
          currentRank += loopDelta;
        }

        // Second jetty of edge
        if (jettys != null) {
          let arrayOffset = reversed ? 2 : 0;
          let rankY = reversed ?
              (layoutReversed ? this.rankTopY[maxRank] : this.rankBottomY[maxRank]) :
              (layoutReversed ? this.rankBottomY[minRank] : this.rankTopY[minRank]);
          let jetty = jettys[parallelEdgeCount * 4 + 3 - arrayOffset];

          if (reversed != layoutReversed) {
            jetty = -jetty;
          }
          let y = rankY - jetty;
          let x = jettys[parallelEdgeCount * 4 + 2 - arrayOffset];

          let modelTarget = graph.model.getTerminal(realEdge, false);
          let realTarget = this.layout.getVisibleTerminal(realEdge, false);

          if (this.layout.isPort(modelTarget) && graph.model.getParent(modelTarget) == realTarget) {
            let state = graph.view.getState(modelTarget);

            if (state != null) {
              x = state.x;
            } else {
              x = realTarget.geometry.x + cell.target.width * modelTarget.geometry.x;
            }
          }

          if (this.orientation == mxConstants.DIRECTION_NORTH ||
              this.orientation == mxConstants.DIRECTION_SOUTH) {
            if (this.layout.edgeStyle == mxHierarchicalEdgeStyle.CURVE) {
              newPoints.push(new mxPoint(x, y - jetty));
            }

            newPoints.push(new mxPoint(x, y));
          } else {
            if (this.layout.edgeStyle == mxHierarchicalEdgeStyle.CURVE) {
              newPoints.push(new mxPoint(y - jetty, x));
            }

            newPoints.push(new mxPoint(y, x));
          }
        }

        if (cell.isReversed) {
          this.processReversedEdge(cell, realEdge);
        }

        this.layout.setEdgePoints(realEdge, newPoints);

        // Increase offset so next edge is drawn next to
        // this one
        if (offsetX == 0.0) {
          offsetX = this.parallelEdgeSpacing;
        } else if (offsetX > 0) {
          offsetX = -offsetX;
        } else {
          offsetX = -offsetX + this.parallelEdgeSpacing;
        }

        parallelEdgeCount++;
      }

      cell.temp[0] = 101207;
    }
  };


  /**
   * Function: setVertexLocation
   *
   * Fixes the position of the specified vertex.
   *
   * Parameters:
   *
   * cell - the vertex to position
   */
  setVertexLocation = (cell) => {
    let realCell = cell.cell;
    let positionX = cell.x[0] - cell.width / 2;
    let positionY = cell.y[0] - cell.height / 2;

    this.rankTopY[cell.minRank] = Math.min(this.rankTopY[cell.minRank], positionY);
    this.rankBottomY[cell.minRank] = Math.max(this.rankBottomY[cell.minRank],
        positionY + cell.height);

    if (this.orientation == mxConstants.DIRECTION_NORTH ||
        this.orientation == mxConstants.DIRECTION_SOUTH) {
      this.layout.setVertexLocation(realCell, positionX, positionY);
    } else {
      this.layout.setVertexLocation(realCell, positionY, positionX);
    }

    this.limitX = Math.max(this.limitX, positionX + cell.width);
  };

  /**
   * Function: processReversedEdge
   *
   * Hook to add additional processing
   *
   * Parameters:
   *
   * edge - the hierarchical model edge
   * realEdge - the real edge in the graph
   */
  processReversedEdge = (graph, model) => {
    // hook for subclassers
  };
}

export default mxCoordinateAssignment;