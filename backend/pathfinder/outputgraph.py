import backend.pathfinder.graphvisualizer as gviz
import backend.pathfinder.graphmanager as gman

import argparse
parser = argparse.ArgumentParser()
parser.add_argument("--key",      help="key")
parser.add_argument("--level",    help="level")
parser.add_argument("--type",     choices=['floor', 'building', 'campus'],
                                  help="'floor', 'building', 'campus'")
parser.add_argument("--name",     help="filename")
parser.add_argument("--format",   help="format(extention)")
parser.add_argument("--dpi",      default=10, help="dpi")
parser.add_argument("--scale",    default=1, help="scale", type=float)
parser.add_argument("--preserve", help="preserve node positions", 
                                  action="store_true")
parser.add_argument("--dumpkeys", action="store_true", 
	              help="dump the keys the nodes in the graph were stored under")
parser.add_argument("--nowrite",  action="store_true", help="do not write graph")
args = parser.parse_args()

graph = None
if args.type == 'floor':
	graph = gman.loadFloorNavGraph(args.key, args.level)
elif args.type == 'building':
	graph = gman.loadBuildingConnectionGraph(args.key)
elif args.type == 'campus':
	graph = gman.loadCampusConnectionGraph(args.key)

if graph is not None:
	if not args.nowrite:
		gviz.outputGraph(graph, None, args.name, args.preserve, args.dpi, 
			             args.format, args.scale)
	if args.dumpkeys:
		for key in graph.nodeMap.keys():
			print key
