import math
import sys
sys.path.insert(0,"/Users/byronwong/Study/UofA/CMPUT401/Project/UofACampusMaps")
from backend.pathfinder.graph import Node
from backend.pathfinder.utils import Position
from backend.pathfinder.utils import straightLineDistance

def RamerDouglasPeucker(nodeList, epsilon):
    #Find the point with the maximum distance
    dmax = 0
    index = 0
    for i in range(1, len(nodeList) - 2):
        d = PerpendicularDistance(nodeList[i], [nodeList[1], nodeList[-1]]) 
        if d > dmax:
            index = i
            dmax = d
 
    #If max distance is greater than epsilon, recursively simplify
    resultList = []
    if dmax >= epsilon:
        # Recursive call
        recResults1 = RamerDouglasPeucker(nodeList[:index+1], epsilon)
        recResults2 = RamerDouglasPeucker(nodeList[index:], epsilon)
        resultList.extend(recResults1[:-1])
        resultList.extend(recResults2)
    else:
        resultList = [nodeList[0],nodeList[-1]]
#     print "result: ", len(ResultList)
    #Return the result
    return resultList

def RamerDouglasPeuckerForNavGraph(navGraph, nodeList, borderGraph, epsilon):
    from backend.pathfinder.graph import Edge
    #Find the point with the maximum distance
#     print "length: ",len(nodeList), " navgraph nodes number", len(navGraph.getNodes())
    if len(nodeList) > 2:
        dmax = 0
        index = 0
        for i in range(1, len(nodeList) - 2):
            edge = Edge(nodeList[1], nodeList[-1])
            d = nodeList[i].getPerpendicularDistance(edge) 
            if d > dmax:
                index = i
                dmax = d
     
        #If max distance is greater than epsilon, recursively simplify
        
        if dmax >= epsilon:
            # Recursive call
    #         print "rb4",len(navGraph.getNodes()), len(nodeList)
            navGraph = RamerDouglasPeuckerForNavGraph(navGraph, nodeList[:index+1], borderGraph, epsilon)
    #         print "r1",len(navGraph.getNodes()), len(nodeList[:index+1])
            navGraph = RamerDouglasPeuckerForNavGraph(navGraph, nodeList[index:], borderGraph, epsilon)
    #         print "r2",len(navGraph.getNodes()), len(nodeList[index:])
        else:        
            intersected = False
            for edge in borderGraph.getEdges():
                simplifiedEdge = Edge(nodeList[0], nodeList[-1])
                if (simplifiedEdge.intersects(edge)):
                    intersected = True 
            if intersected:
                if len(nodeList) == 3:
                    return navGraph
#                 print "left 2, range: 0 to",index+1 
                navGraph = RamerDouglasPeuckerForNavGraph(navGraph, nodeList[:index+1], borderGraph, epsilon)
#                 print "right 2, range:", index, "to",len(nodeList)-1
                navGraph = RamerDouglasPeuckerForNavGraph(navGraph, nodeList[index:], borderGraph, epsilon)
            else:
                for i in range(1,len(nodeList)-1):
                    if nodeList[i] in navGraph.getNodes():
                        navGraph.removeNode(nodeList[i])
                navGraph.addEdge(nodeList[0], nodeList[-1], straightLineDistance(nodeList[0], nodeList[-1]))
    return navGraph
    #     print "result: ", len(ResultList)
    #Return the result


if __name__ == "__main__":    
    NodeX = Node(None, 1,Position(0,1))
    NodeA = Node(None, 2,Position(0,0))
    NodeB = Node(None, 3,Position(1,1))
    print PerpendicularDistance(NodeX, [NodeA,NodeB])
