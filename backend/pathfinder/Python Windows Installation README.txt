Windows Python installation checklist

Python 2.7 32 bits (Since using 64bits may leads to modify registry key when isntall Polygon)
Link http://www.python.org/ftp/python/2.7.3/python-2.7.3.msi

easy_instal 2.6
Link https://pypi.python.org/packages/2.7/s/setuptools/setuptools-0.6c11.win32-py2.7.exe#md5=57e1e64f6b7c7f1d2eddfc9746bbaf20

Polygon (I use the executable, cannot use the easy_install)
http://cloud.github.com/downloads/jraedler/Polygon2/Polygon-2.0.5.win32-py2.7-withNumPy.exe

numpy (easy_install)
COMMAND: easy_install numpy

pyparsing 1.5.7 (using easy_install)
COMMAND: easy_install pyparsing==1.5.7

pydot 
Cant use easy_install
Donwload https://pydot.googlecode.com/files/pydot-1.0.28.zip, 
and run "setup.py install")

GraphViz 2.3.0
Download: http://www.graphviz.org/Download_windows.php
	#to fix err:  File "build\bdist.win32\egg\pydot.py", line 1953, in create
	#'GraphViz\'s executables not found' )
	#InvocationException: GraphViz's executables not found
	#goto https://code.google.com/p/pydot/issues/detail?id=65
	#Note: restart the intepreter to get the changes in pydot.py (as suggested by the link) to take effect