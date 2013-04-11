/**
 * Created with JetBrains WebStorm.
 * User: Dean
 * Date: 22/05/12
 * Time: 8:50 AM
 * To change this template use File | Settings | File Templates.
 */
// Build out the Name space if it doesn't all ready exist
var UAlberta = UAlberta !== undefined ? UAlberta : {};
UAlberta.Maps = UAlberta.Maps !== undefined ? UAlberta.Maps : {};

UAlberta.Maps.Interior = (function (interior, $) {
    'use strict';
        // Canvas 2D context element
    var _context,
        // Canvas element
        _canvasArea,
        // The offset of the canvas on the page
        _canvasOffset,
        // The width of the canvas element
        _sceneWidth = 0,
        // The height of the canvas element
        _sceneHeight = 0,
        // Items to draw on the canvas
        _toDraw = [],
        // Enum of available items that can be drawn
        _drawType = {point: 1, line: 2, polygon: 3, triangle: 4, text: 5, image: 6, image_2D: 7, circle: 8},
        // If the 3D engine has been initialized
        _isInitialised = false,
        // Render Timer
        _renderTimer,
        // If the device is a touch device
        _isTouchable = 'ontouchstart' in window,
        // If the touch device allows multi touch points. Currently limited to checking for android versions less than 3
        _isMultiTouchable = true,
        // The time to wait between rendering the scene during an action. Works out to be 1000ms / FPS
        _maxRenderTime = 33,
        // The building key
        _buildingKey,
        //The level of the building
        _level,
        // The time that the last render was completed
        _lastRenderTime = 0,
        _isMobile = false,

        /*
        * Static Values Used in Calculations
        */
        _twoPi = Math.PI * 2,
        _halfPi = Math.PI / 2,

        /*
         * Camera Class
         *  All functionality related the the camera and its position around the 3D scene
         */
        _camera = {
            /* The rotation of the camera around each axis. This rotation is in radians */
            rX: 0,
            rY: Math.PI,
            rZ: 0,
            /* The field of depth of the scene */
            depth: 1000,
            /* The cameras position relative to the scenes center */
            offsetX: 0,
            offsetY: 0,
            offsetZ: 1000,
            /* The starting camera rotation */
            defaultCameraRotation: 0,
            /* The starting camera pitch */
            defaultCameraPitch: 0,
            /* The starting camera roll */
            defaultCameraRoll: 0,

            zoomBounds: {zIn: -500, zOut: 1000},

            pitchBounds: {bottom: -0.35, top: -_halfPi},

            /*
             * Zoom Camera
             * Moves the camera closer or further away from the scene by adding an amount to the current Z offset.
             * Calls setCameraZoom function
             *
             * amount: The amount to move the camera.
             */
            zoomCamera: function(amount){
                _camera.setCameraZoom(_camera.offsetZ + amount);
            },

            /*
             * Pan Camera X
             * Moves the camera along the X axis of the screen
             * Calls setCameraPanX function
             *
             * amount: The amount to move the camera.
             */
            panCameraX: function(amount){
                _camera.setCameraPanX(_camera.offsetX + amount);
            },

            /*
             * Pan Camera Y
             * Moves the camera along the Y axis of the screen
             * Calls setCameraPanY function
             *
             * amount: The amount to move the camera.
             */
            panCameraY: function(amount){
                _camera.setCameraPanY(_camera.offsetY + amount);
            },

            /*
             * Rotate Camera
             * Rotates the Camera (around the Z axis) by adding the passed amount to the current rotation amount.
             * Result is camera rotating turn table style to view the different sides of the model
             * Calls setCameraRotationZ function
             *
             * amount: The amount to add to the camera Rotation.
             */
            rotateCamera: function(amount){
                _camera.setCameraRotationZ(_camera.rZ + amount);
            },

            /*
             * Pitch Camera
             * Pitchs the Camera (around the X axis) by adding the passed amount to the current rotation amount
             * Result is camera rotating the scene top and bottom
             * Calls setCameraRotationX function
             *
             * amount: The amount to add to the camera Rotation.
             */
            pitchCamera: function(amount){
                _camera.setCameraRotationX(_camera.rX + amount);
            },

            /*
             * Roll Camera
             * Rolls the Camera (around the Y axis) by adding the passed amount to the current rotation amount
             * Result is camera rotating the scene left and right
             * Calls setCameraRotationY function
             *
             * amount: The amount to add to the camera Rotation.
             */
            rollCamera: function(amount){
                _camera.setCameraRotationY(_camera.rY + amount);
            },

            /*
             * Set Camera Zoom
             * Sets the cameras Z offset to a specified value
             *
             * amount: The amount of the new zoom.
             */
            setCameraZoom: function(amount){
                if(!isNaN(amount)){
                    if(amount > _camera.zoomBounds.zOut){amount = _camera.zoomBounds.zOut; }
                    if(amount < _camera.zoomBounds.zIn){amount = _camera.zoomBounds.zIn; }
                    _camera.offsetZ = Math.round(amount);
                }else{
                    $.error("Zoom amount is a non-number. Function: UAlberta.Maps.Interior.camera.zoomCamera(amount)");
                }
            },

            /*
             * Set Camera Pan X
             * Sets the cameras X offset to a specified value
             *
             * amount: The amount of the new X offset.
             */
            setCameraPanX: function(amount){
                if(!isNaN(amount)){
                    _camera.offsetX = Math.round(amount);
                }else{
                    $.error("Pan X amount is a non-number. Function: UAlberta.Maps.Interior.camera.panCameraX(amount)");
                }
            },

            /*
             * Set Camera Pan Y
             * Sets the cameras Y offset to a specified value
             *
             * amount: The amount of the new Y offset.
             */
            setCameraPanY: function(amount){
                if(!isNaN(amount)){
                    _camera.offsetY = Math.round(amount);
                }else{
                    $.error("Pan Y amount is a non-number. Function: UAlberta.Maps.Interior.camera.panCameraY(amount)");
                }
            },

            /*
             * Set Camera Rotation X
             * Sets the cameras X rotation to a specified value
             *
             * amount: The amount of the new X rotation.
             */
            setCameraRotationX: function(amount){
                if(!isNaN(amount)){
                    if(amount <= _camera.pitchBounds.bottom && amount >= _camera.pitchBounds.top){
                        _camera.rX = _utilities.roundNumber(amount, 2);
                    }
                }else{
                    $.error("Pitch amount is a non-number. Function: UAlberta.Maps.Interior.camera.pitchCamera(amount)");
                }
            },

            /*
             * Set Camera Rotation Y
             * Sets the cameras Y rotation to a specified value
             *
             * amount: The amount of the new Y rotation.
             */
            setCameraRotationY: function(amount){
                if(!isNaN(amount)){
                    _camera.rY = _utilities.roundNumber(amount, 2);
                }else{
                    $.error("Roll amount is a non-number. Function: UAlberta.Maps.Interior.camera.rollCamera(amount)");
                }
            },

            /*
             * Set Camera Rotation Z
             * Sets the cameras Z rotation to a specified value
             *
             * amount: The amount of the new Z rotation.
             */
            setCameraRotationZ: function(amount){
                if(!isNaN(amount)){
                    _camera.rZ = _utilities.roundNumber(amount, 2);
                }else{
                    $.error("Rotation amount is a non-number. Function: UAlberta.Maps.Interior.camera.rotateCamera(amount)");
                }
            },

            /*
             * Reset Camera
             * Resets the camera to the default starting position.
             * Re-renders the scene
             */
            resetCamera: function(){
                _camera.centerCamera(true);
            },

            /*
             * Center Camera
             * Centers the camera on the objects drawn in the scene.
             * Sets the cameras pan offsets as well as the zoom level.
             * Also takes into consideration the default tilt and rotation of the camera
             */
            centerCamera: function(doRotation){
                var i = _toDraw.length - 1,
                    maxX = 0,
                    maxY = 0,
                    maxZ = 0,
                    minX = 0,
                    minY = 0,
                    minZ = 0,
                    bb, difMax, difMin;

                _camera.offsetX = 0;
                _camera.offsetY = 0;
                _camera.offsetZ = 500;
                _camera.rX = _camera.defaultCameraPitch;
                _camera.rZ = _camera.defaultCameraRotation;

                while(i) {

                    _toDraw[i].update();
                    bb = _toDraw[i].getBoundingBox();
                    if(bb.max.x > maxX){maxX = bb.max.x;}
                    else if(bb.min.x < minX){minX = bb.min.x;}

                    if(bb.max.y > maxY){maxY = bb.max.y;}
                    else if(bb.min.y < minY){minY = bb.min.y;}

                    if(bb.max.z > maxZ){maxZ = bb.max.z;}
                    else if(bb.min.z < minZ){minZ = bb.min.z;}

                    i -= 1;
                }

                var finalZoom = 500;
                if(maxX > (_sceneWidth/2) || minX < ((_sceneWidth/2) * -1)){
                    difMax = ((maxX - (_sceneWidth/2))/_sceneWidth) + 1;
                    difMin = Math.abs((minX + (_sceneWidth/2))/_sceneWidth) + 1;
                    finalZoom = Math.floor(_camera.offsetZ + (_camera.offsetZ * difMax) + ( _camera.offsetZ * difMin));
                    _camera.zoomBounds.zOut = finalZoom;
                }

                _camera.offsetX = _sceneWidth / 2;
                _camera.offsetY = _sceneHeight / 2;

                if(doRotation){
                    loadRoatation( _utilities.roundNumber(((2 * Math.PI)/3),3),finalZoom);
                }
                else{
                    _camera.offsetZ = finalZoom;
                    render();
                }
            },

            controlPanCameraY: function(amount){
                _camera.panCameraY(amount);
                render();
            },

            controlPanCameraX: function(amount){
                _camera.panCameraX(amount);
                render();
            },

            controlRotateCamera: function(amount){
                _camera.rotateCamera(amount);
                render();
            },

            controlZoomCamera: function(amount){
              _camera.zoomCamera(amount);
                render();
            }
        },

        /*
         * Mouse Class
         * All functionality for using the mouse with the 3D canvas area.
         */
        _mouse = {
            /* If the left mouse button is clicked down or not */
            downState: false,
            /* The position where the mouse was clicked */
            pos: [],
            /* If an action was preformed or if the input was a single click */
            actionPreformed: false,
            /* The time that the current click was done */
            clickStartTime: null,
            /* The time that the previous click was done */
            prevClickEndTime: null,
            /* The position that the previous click was done */
            prevClickPos: [{x:0, y:0}],
            /* The time delay (in miliseconds) between clicks to determine if it is a double click or not */
            doubleClickInterval: 200,
            /* The distance in pixels between the two clicks to determine if the clicks were close enough to be considered a double click */
            doubleClickDistance: 20,
            /* A timeout event for the single click. Used to belay single click functionality to see if a double click is going to be done */
            singleClickEvent: null,

            /*
             * Mouse Down
             * Handler of the mouse down event
             * Determines the offset from the camera position
             * Determines the offset of the cameras rotation
             * Attaches the mouse move event to the _canvasArea
             *
             * evt: The browser mouse event properties
             */
            mouseDown: function(evt){
                if(evt.button == 0){
                    _mouse.downState = true;
                    _mouse.pos = _utilities.getEventXY(evt);
                    _mouse.clickStartTime = new Date().getTime();
                }
            },

            /*
             * Mouse Up
             * Handler of the mouse up event
             * Checks to see if a mouse click was inside of a polygon
             * Resets the offset and rotation variables
             *
             * evt: The browser mouse event properties
             */
            mouseUp: function(evt){
                if(evt.button == 0 && _mouse.pos.length > 0){
                    var i,
                        now = new Date().getTime(),
                        xDis = Math.abs(_mouse.prevClickPos[0].x - _mouse.pos[0].x),
                        yDis = Math.abs(_mouse.prevClickPos[0].y - _mouse.pos[0].y),
                        isDoubleClick = !!(_mouse.clickStartTime - _mouse.prevClickEndTime < _mouse.doubleClickInterval) && (Math.max(xDis,yDis) < _mouse.doubleClickDistance);

                    if(isDoubleClick){
                        clearTimeout(_mouse.singleClickEvent);
                        _mouse.singleClickEvent = null;
                        _mouse.actionPreformed = false;
                        _mouse.pos = [];
                        _mouse.prevClickEndTime = 0;
                    }else{
                        if(_mouse.singleClickEvent == null){
                            _mouse.singleClickEvent = setTimeout(function(){
                                
                                if(!_mouse.actionPreformed){

                                    for(i = 0; i< _toDraw.length; i++){

                                        if(_toDraw[i].getType() == _drawType.polygon){
                                            if(_toDraw[i].pointInPoly(_mouse.pos[0])){

                                                _toDraw[i].extrudeEdges(50);
                                            }else{
                                                _toDraw[i].clearExtrusion();
                                            }
                                        }
                                    }
                                    UAlberta.Maps.Exterior.closeOpenWindows();
                                }
                                _mouse.actionPreformed = false;
                                _mouse.pos = [];
                                render();
                                _mouse.singleClickEvent = null;
                            }, _mouse.doubleClickInterval);
                        }
                        _mouse.prevClickEndTime = now;
                        _mouse.prevClickPos = _mouse.pos;
                    }
                    _mouse.downState = false;
                }
            },

            /*
             * Mouse Move
             * Handler of the mouse move event
             * Calculates the new camera position (panning) if shift key is now pressed
             * Calculates the new camera tile and rotation if the shift key is pressed
             * Re-renders the scene
             *
             * evt: The browser mouse event properties
             */
            mouseMove: function(evt){
                var x = evt.pageX - _canvasOffset.left,
                    y = evt.pageY - _canvasOffset.top,
                    offset, moveAmount;
                if(_mouse.downState && _mouse.pos.length == 1){
                    offset = _mouse.pos[0];
                    if(!evt.shiftKey){
                        moveAmount = {x:evt.pageX - offset.offsetX, y:evt.pageY - offset.offsetY};
                        _camera.setCameraPanX(moveAmount.x);
                        _camera.setCameraPanY(moveAmount.y);
                    }else{
                        _camera.setCameraRotationX(((((y - offset.offsetY) / _sceneHeight)*_halfPi) - offset.rX) % _twoPi);
                        _camera.setCameraRotationZ(((-((x - offset.offsetX) / _sceneWidth - 0.5)*_twoPi) - offset.rZ) % _twoPi);
                    }
                    render();
                    _mouse.actionPreformed = true;
                }
            },

            /*
             * Mouse Wheel
             * Handler of the mouse wheel event
             * Calculates the new camera zoom level based on the direction of the mouse wheel
             * Re-renders the scene
             *
             * evt: The mouse wheel event properties
             */
            mouseWheel: function(evt){
                evt.preventDefault();
                $.event.fix(evt);

                var delta = 0;

                // Old scrollwheel delta
                if ( evt.wheelDelta ) { delta = evt.wheelDelta/120; }
                if ( evt.detail     ) { delta = -evt.detail/3; }

                // Gecko
                if ( evt.axis !== undefined && evt.axis === evt.HORIZONTAL_AXIS ) { delta = 0; }

                // Webkit
                if ( evt.wheelDeltaY !== undefined ) { delta = evt.wheelDeltaY/120; }

                _camera.zoomCamera(delta * -10);
                render();
            },

            mouseHold: function(id, action, variable, start, speedup){
                var t, origStart = start,
                    repeat = function(){
                    action(variable);
                    t = setTimeout(repeat, start);
                    start = start / speedup;
                };

                $("#" + id).mousedown(function(){
                    repeat();
                }).bind("mouseup mouseleave", function(){
                        clearTimeout(t);
                        start = origStart;
                });
            }
        },

        /*
         * Gestures Class
         * All functionality for using hand gestures with the 3D canvas area.
         */
        _gestures = {
            /* An enum with the different touch actions available */
            touchStateTypes: {none: 0, drag: 1, transform: 2},
            /* An enum with the different transform actions available */
            transformStateTypes: {none: 0, rotate: 1, zoom: 2, tilt: 3},
            /* The current touch action enabled */
            touchState: 0,
            /* The current transform action enabled */
            transformState: 0,
            /* A list of touch positions on the screen */
            touchPos: [],
            /* This is a variable storing the last amount a finger moved. Used to calculate the amount to rotate, zoom or tilt the scene depending on the current mode */
            lastDistance: 0,
            /* If this is the first time the screen has been touched for this gesture operation */
            firstTouch: false,
            /* If an action was preformed or if the input was a single tap */
            actionPreformed: false,
            /* The time that the current touch started */
            touchStartTime: null,
            /* The time that the previous touch started */
            prevTouchEndTime: null,
            /* The position of the previous touch */
            prevTouchPos: [{x:0, y:0}],
            /* The time in miliseconds between taps to determine if they are a double tap or not */
            doubleTapInterval: 200,
            /* The distance in pixels between taps to determine if they are a double tap or not */
            doubleTapDistance: 20,
            /* A timeout event for the single tap. Used to belay single click functionality to see if a double tap is going to be done */
            singleTouchEvent: null,

            /*
             * Touch Start
             * Handler of the touch start event
             * Determines the offset from the camera position
             * Determines the offset of the cameras rotation
             * Attaches the mouse move event to the _canvasArea
             *
             * evt: The browser touch event properties
             */
            touchStart: function(evt){
                evt.preventDefault();

                _gestures.touchPos = _utilities.getEventXY(evt);
                if(evt.touches.length == 1){
                    _gestures.touchState = _utilities.singleTouchInputMode();
                    _gestures.touchStartTime = new Date().getTime();
                }else if(evt.touches.length == 2){
                    _gestures.touchState = _gestures.touchStateTypes.transform;
                    _gestures.firstTouch = true;
                }
            },

            /*
             * Touch End
             * Handler of the Touch End event
             * Resets the offset and rotation variables
             * Unbinds the mouse move event from the _canvasArea
             *
             * evt: The browser touch event properties
             */
            touchEnd: function(evt){
                evt.preventDefault();
                if(evt.touches.length == 0 && _gestures.touchPos.length > 0){

                    var xDis = Math.abs(_gestures.prevTouchPos[0].x - _gestures.touchPos[0].x),
                        yDis = Math.abs(_gestures.prevTouchPos[0].y - _gestures.touchPos[0].y),
                        isDoubleTap = !!(_gestures.touchStartTime - _gestures.prevTouchEndTime < _gestures.doubleTapInterval) && (Math.max(xDis,yDis) < _gestures.doubleTapDistance),
                        now = new Date().getTime(),
                        i;

                    if(isDoubleTap){
                        clearTimeout(_gestures.singleTouchEvent);
                        _gestures.actionPreformed = false;
                        _gestures.touchPos = [];
                        _gestures.prevTouchEndTime = 0;
                    }else{
                        _gestures.singleTouchEvent = setTimeout(function(){
                            if(!_gestures.actionPreformed) {
                                for(i = 0; i< _toDraw.length; i++){
                                    if(_toDraw[i].getType() == _drawType.polygon){
                                        if(_toDraw[i].pointInPoly(_gestures.touchPos[0])){
                                            _toDraw[i].extrudeEdges(50);
                                        }else{
                                            _toDraw[i].clearExtrusion();
                                        }
                                    }
                                }
                                UAlberta.Maps.Exterior.closeOpenWindows();
                            }
                            _gestures.actionPreformed = false;
                            _gestures.touchPos = [];
                            render();
                        }, _gestures.doubleTapInterval);

                        _gestures.prevTouchEndTime = now;
                        _gestures.prevTouchPos = _gestures.touchPos;
                    }
                    _gestures.touchState = _gestures.touchStateTypes.none;
                    _gestures.lastDistance = 0;
                    _gestures.transformState = _gestures.transformStateTypes.none;

                } else if(evt.touches.length == 1){
                    _gestures.downState = _gestures.touchStateTypes.drag;
                    _gestures.lastDistance = 0;
                    _gestures.touchPos = [];
                    _gestures.touchPos.push({
                        x: evt.touches[0].pageX,
                        Y: evt.touches[0].pageY,
                        offsetX: evt.touches[0].pageX - _camera.offsetX,
                        offsetY: evt.touches[0].pageY - _camera.offsetY
                    });
                }
            },

            /*
             * Touch Move
             * Handler of the touch move event
             * Calculates the new camera position (panning) when one finger is used
             * Calculates the new camera tile and rotation if the toggle is selected (non multi touch) or certain multi touch gestures are done
             * Re-renders the scene
             *
             * evt: The browser touch event properties
             */
            touchMove: function(evt){
                evt.preventDefault();
                var evtPos = _utilities.getEventXY(evt),
                    distance = _utilities.calculateFingerDistance(_gestures.touchPos, evtPos),
                    rotation, scale;

                if(_gestures.touchState == _gestures.touchStateTypes.transform && evt.touches.length == 2 ){

                    rotation = _utilities.calculateFingerRotation(_gestures.touchPos, evtPos);
                    scale = _utilities.calculateFingerScale(_gestures.touchPos, evtPos) * -10;

                    if((Math.abs(rotation) > 0.25 && _gestures.firstTouch) || _gestures.transformState == _gestures.transformStateTypes.rotate){
                        _gestures.transformState = _gestures.transformStateTypes.rotate;
                        _camera.rotateCamera(rotation - _gestures.lastDistance);
                        _gestures.lastDistance = rotation;
                        _gestures.firstTouch = false;
                    }else if((Math.abs(scale) > 25 && _gestures.firstTouch) || _gestures.transformState == _gestures.transformStateTypes.zoom){
                        _gestures.transformState = _gestures.transformStateTypes.zoom;
                        _camera.setCameraZoom(scale + _gestures.touchPos[0].offsetZ);
                        _gestures.firstTouch = false;
                    } else if((Math.abs(distance.y) > 30 && Math.abs(distance.x) < 30 && _gestures.firstTouch) || _gestures.transformState == _gestures.transformStateTypes.tilt){
                        _gestures.transformState = _gestures.transformStateTypes.tilt;
                        _camera.pitchCamera((distance.y - _gestures.lastDistance)/100);
                        _gestures.lastDistance = distance.y;
                        _gestures.firstTouch = false;
                    }

                }else if(_gestures.touchState == _gestures.touchStateTypes.transform && !_isMultiTouchable){
                    if($("input[name='touchType']:checked").val() == "zoom"){
                        _camera.zoomCamera(distance.y - _gestures.lastDistance);
                        _gestures.lastDistance = distance.y;
                    }else if($("input[name='touchType']:checked").val() == "rotate"){
                        var offset = _gestures.touchPos[0];
                        _camera.setCameraRotationX(((((evtPos[0].y - offset.offsetY) / _sceneHeight)*_halfPi) - offset.rX) % _twoPi);
                        _camera.setCameraRotationZ(((-((evtPos[0].x - offset.offsetX) / _sceneWidth - 0.5)*_twoPi) - offset.rZ) % _twoPi);
                    }
                } else{
                    $("#mousePos").html("X: "+ evtPos[0].x+", Y: "+ evtPos[0].y);
                    _camera.setCameraPanX(evt.touches[0].pageX - _gestures.touchPos[0].offsetX);
                    _camera.setCameraPanY(evt.touches[0].pageY - _gestures.touchPos[0].offsetY);
                }
                render();
                _gestures.actionPreformed = true;
            }
        },

        /*
         * Utilities class
         * General utility functions
         */
        _utilities = {

            /*
             * Start Timer
             * Starts a timer that is used for determining render time
             */
            startTimer: function(){
                _renderTimer = new Date();
            },

            /*
             * Round Number
             * Rounds numbers to a specified decimal place
             *
             * num: The number to round
             * dec: The number of decimal places to round too
             *
             * return: The rounded number.
             */
            roundNumber: function(num, dec){
                var pow = Math.pow(10,dec);
                return Math.round(num*pow)/pow;
            },

            /*
             * Get Z Index
             * Returns the average Z Index for a list of points
             *
             * points: A list of points
             *
             * return: The calculated Z Index value
             */
            getZIndex: function(points){
                var i = points.length, l = points.length, t = 0;
                while(i--){
                    t += points[i] != null? points[i].z : 0;
                }
                return _utilities.roundNumber((t/l),2);
            },

            /*
             * Calc Rotation
             * Given a 3D position calculates the new points based on the camera's rotation
             *
             * pos: the point position to rotate
             *
             * return: Returns the new position after the camera's rotation is applied
             */
            calcRotation: function(pos){
                var zcos = Math.cos(_camera.rY),
                    zsin = Math.sin(_camera.rY),
                    ycos = Math.cos(_camera.rX),
                    ysin = Math.sin(_camera.rX),
                    xcos = Math.cos(_camera.rZ),
                    xsin = Math.sin(_camera.rZ),
                    yx = pos.z * xcos - pos.x * xsin,
                    yy = pos.y,
                    yz = pos.z * xsin + pos.x * xcos,
                    xy = yy * ycos - yz * ysin,
                    xz = yy * ysin + yz * ycos,
                    zx = yx * zcos - xy * zsin,
                    zy = yx * zsin + xy * zcos;
                return {x: zx, y: zy, z: xz};
            },

            /*
             * Transform 2D
             * Transforms a 3D point to a 2D point.
             * Hides points that appear behind the camera
             *
             * x: The 3D x coordinate
             * y: The 3D y coordinate
             * z: the 3D z coordinate
             *
             * return: Returns a new position with the 2D x and y points and z representing the zindex of the point
             *         Null if the point is behind the camera
             */
            transform2D: function(x,y,z){
                var rot = _utilities.calcRotation({x:x,y:y,z:z});

                if(rot.z >= (-1 * _camera.depth) - _camera.offsetZ){
                    var _scale = _camera.depth / (rot.z + _camera.depth + _camera.offsetZ);
                    if(isNaN(_scale) || !isFinite(_scale)){_scale = 1;}
                    return {
                        x: _utilities.roundNumber(rot.x * _scale + _camera.offsetX,2),
                        y: _utilities.roundNumber(rot.y * _scale + _camera.offsetY,2),
                        z: _utilities.roundNumber(_scale + (_scale * y),2)
                    };
                }
                else{
                   return null;
                }
            },

            /*
             * Get Event X Y
             * Returns a list containing all of the X Y points from a mouse or touch event
             *
             * evt: The triggered event object
             *
             * return: Returns a list of positions where click / touch events have been triggered
             */
            getEventXY: function(evt){
                var x, y, oX, oY;
                if(_isTouchable){
                    var _pos = [];
                    for(var i = 0; i < evt.touches.length; i++){
                         x = evt.touches[i].pageX - _canvasOffset.left;
                         y = evt.touches[i].pageY - _canvasOffset.top;
                         oX = evt.touches[i].pageX - _camera.offsetX;
                         oY = evt.touches[i].pageY - _camera.offsetY;
                        _pos.push({
                            x: x,
                            y: y,
                            offsetX: oX,
                            offsetY: oY,
                            offsetZ: _camera.offsetZ,
                            rX: (((y - oY) / _sceneHeight)*Math.PI/2) -_camera.rX,
                            rY: _camera.rY,
                            rZ: (-((x - oX) / _sceneWidth - 0.5)*Math.PI*2) - _camera.rZ
                        });
                    }
                    return _pos;
                }else{
                    x = evt.pageX - _canvasOffset.left;
                    y = evt.pageY - _canvasOffset.top;
                    oX = evt.pageX - _camera.offsetX;
                    oY = evt.pageY - _camera.offsetY;
                    return [{
                        x: x,
                        y: y,
                        offsetX: oX,
                        offsetY: oY,
                        offsetZ: _camera.offsetZ,
                        rX: (((y - oY) / _sceneHeight)*Math.PI/2) -_camera.rX,
                        rY: _camera.rY,
                        rZ: (-((x - oX) / _sceneWidth - 0.5)*Math.PI*2) - _camera.rZ
                    }];
                }
            },

            /*
             * Calculate Finger Rotation
             * Calculates the rotation angel in Radians between two sets of points representing fingers.
             *
             * start: A list of points that represent where the screen was first touched
             * end: A list of points that represent the current touch locations
             *
             * return: Returns an decimal representing the rotation angle in radians
             */
            calculateFingerRotation: function(start, end){
                if(start.length == 2 && end.length == 2){
                    var x = start[0].x - start[1].x,
                        y = start[0].y - start[1].y,
                        start_rotation = Math.atan2(y,x);
                    x = end[0].x - end[1].x;
                    y = end[0].y - end[1].y;
                    var end_rotation = Math.atan2(y,x);

                    return end_rotation - start_rotation;
                }
                return 0;
            },

            /*
             * Calculate Finger Scale
             * Calculates the scale size between two sets of points representing fingers
             *
             * start: A list of points that represent where the screen was first touched
             * end: A list of points that represent the current touch locations
             *
             * return: Returns an decimal representing the scale between the two fingers
             */
            calculateFingerScale: function(start,end){
                if(start.length == 2 && end.length == 2){
                    var x = start[0].x - start[1].x,
                        y = start[0].y - start[1].y,
                        start_distance = Math.sqrt((x*x) + (y*y));
                    x = end[0].x - end[1].x;
                    y = end[0].y - end[1].y;
                    var end_distance = Math.sqrt((x*x) + (y*y));

                    return end_distance - start_distance;
                }
                return 0;
            },

            /*
             * Calculate Finger Distance
             * Calculates the x and y distance between list of points representing fingers starting and ending position
             *
             * start: A list of points that represent where the screen was first touched
             * end: A list of points that represent the current touch locations
             *
             * return: Returns an object that contains the x and y distance traveled by the fingers as they move across the screen
             */
            calculateFingerDistance: function(start,end){
                var dis = {x: 0, y: 0};
                if(start.length == end.length){

                    for(var i = 0; i < start.length; i++){
                        dis.x += end[i].x - start[i].x;
                        dis.y += end[i].y - start[i].y;
                    }

                    dis.x = dis.x / start.length;
                    dis.y = dis.y / start.length;
                }
                return dis;
            },

            /*
             * Single Touch Input Mode
             * FOR NON MULTI TOUCH DEVICES ONLY
             * Determines if the current touch mode is dragging or transformation based on a radio button list.
             * These buttons are used to mimic the multi touch functionality on no multi touch devices
             *
             * return: Returns a touch state based on the selected toggle boxes
             */
            singleTouchInputMode: function(){
                if(!_isMultiTouchable){
                    if($("input[name='touchType']:checked").val() != "pan"){
                        return _gestures.touchStateTypes.transform;
                    }
                }
                return _gestures.touchStateTypes.drag;
            },

            rotateCompasPoint:function(point, center, angle){
                var newPoint = {x: point.x - center.x, y: point.y - center.y};
                var rotatedPoint = {
                    x: newPoint.x * Math.cos(angle) - newPoint.y * Math.sin(angle),
                    y: newPoint.x * Math.sin(angle) + newPoint.y * Math.cos(angle)
                };

                return {x: rotatedPoint.x + center.x, y: rotatedPoint.y + center.y};
            },

            renderCompass: function(){
                var dif = _camera.rZ - _halfPi, center = {x:_sceneWidth - 10 , y: 45 },
                    top, side,circleRadius = 30,triangleHeight = 25,triangleWidth = 10,
                    textTop = 16;

                if(_isMobile){
                    circleRadius = circleRadius/1.5;
                    triangleHeight = triangleHeight/1.5;
                    triangleWidth = triangleWidth/1.5;
                    textTop = (textTop * 1.5) + 10;
                    center.y += 10;
                }
                center.x = center.x - (circleRadius * 2);

                //Circle
                _context.beginPath();
                _context.arc(center.x,center.y,circleRadius,0,_twoPi,false);
                _context.fillStyle = "#FFFFFF";
                _context.fill();
                _context.lineWidth = 3;
                _context.strokeStyle = "#606060";
                _context.stroke();

                //Square
                _context.lineWidth = 1;
                top = _utilities.rotateCompasPoint({x:center.x, y:textTop},center,dif);
                _context.fillRect(top.x-6,top.y-6,12,12);
                _context.strokeRect(top.x-6,top.y-6,12,12);

                //Text
                _context.fillStyle = "#000000";
                _context.font="bold 12px sans-serif";
                _context.fillText("N",top.x-4,top.y+4,10);

                //Triangle 1
                top = _utilities.rotateCompasPoint({x:center.x, y:center.y-triangleHeight},center,dif);
                side = _utilities.rotateCompasPoint({x:center.x + triangleWidth, y:center.y},center,dif);
                _context.fillStyle = "#044C02";
                _context.beginPath();
                _context.moveTo(center.x,center.y);
                _context.lineTo(side.x,side.y);
                _context.lineTo(top.x,top.y);
                _context.fill();

                //Triangle 2
                side = _utilities.rotateCompasPoint({x:center.x - triangleWidth, y:center.y},center,dif);
                _context.fillStyle = "#007D43";
                _context.beginPath();
                _context.moveTo(center.x,center.y);
                _context.lineTo(side.x,side.y);
                _context.lineTo(top.x,top.y);
                _context.fill();

                //Triangle 3
                top = _utilities.rotateCompasPoint({x:center.x, y:center.y+triangleHeight},center,dif);
                side = _utilities.rotateCompasPoint({x:center.x + triangleWidth, y:center.y},center,dif);
                _context.fillStyle = "#808080";
                _context.beginPath();
                _context.moveTo(center.x,center.y);
                _context.lineTo(side.x,side.y);
                _context.lineTo(top.x,top.y);
                _context.fill();

                //Triangle 4
                side = _utilities.rotateCompasPoint({x:center.x - triangleWidth, y:center.y},center,dif);
                _context.fillStyle = "#A0A0A0";
                _context.beginPath();
                _context.moveTo(center.x,center.y);
                _context.lineTo(side.x,side.y);
                _context.lineTo(top.x,top.y);
                _context.fill();
            }

        },

        _dataImport = {
            //The URL to the web service to load the data from
            hostUrl: window.location.protocol + "//" + window.location.hostname + "/WebService/Maps/UWSDataService.asmx/GetInteriorData",

            //The amount of time (in milliseconds) for the AJAX request to wait before timing out
            timeout: 30000,

            //Converts a javascript object into a JSON string
            toJSON: function(obj){
                if(JSON.stringify){
                    return "{ \"parameters\":" + JSON.stringify(obj) + "}";
                }
                else{
                    return "{ \"parameters\":" + $.toJSON(obj) + "}";
                }
            },

            //The ajax return success function
            ajaxSuccess: function(data, displayName, doRotation){
                //Make sure data is not null and the data object has our results
                if(!data && !data.d){return;}
                data = data.d;
                //Make sure the data type is what we are expecting
                if(!data.__type && data.__type != "UAlberta.WebService.Maps.Data.InteriorReturn"){return;}

                var i;
                //Load all Polygons
                for(i = 0; i < data.Polys.length; i++){
                    addPolygon(data.Polys[i].Path, data.Polys[i].Triangles, data.Polys[i].Options);
                }
                //Load all Lines
                for(i = 0; i < data.Lines.length; i++){
                    addLine(data.Lines[i].Start,data.Lines[i].End,data.Lines[i].Options);
                }
                //Load all Points
                for(i = 0; i < data.Points.length; i++){
                    addPoint(data.Points[i].Point, data.Points[i].Options);
                }
                //Load all Text
                for(i = 0; i < data.Text.length; i++){
                    addText(data.Text[i].Text, data.Text[i].Point, data.Text[i].Options);
                }
                //Load all Images
                for(i = 0; i < data.Images.length; i++){
                    addImage(data.Images[i].ImageURL,data.Images[i].TopLeft,data.Images[i].Width,data.Images[i].Height,data.Images[i].Options);
                }

                //Show the Exterior reference image if there is one
                if(data.exteriorImage != ""){
                    $(".leftNav_interior_buildingImage").html("<img src='" + data.exteriorImage + "' alt='Building Exterior Image' />");
                }

                UAlberta.Maps.Exterior.loadingBarToggle(false,displayName);
                _camera.centerCamera(doRotation);
            },

            //The AJAX return error function
            ajaxError: function(name){
                if(UAlberta.Maps.Exterior){
                    UAlberta.Maps.Exterior.loadingBarToggle(false,name);
                    UAlberta.Maps.Exterior.errorBarToggle();
                    $("#leftNav_exit_btn").click();
                }
            }
        };

    /*
     * Initialize
     * Initialize the 3D rendering engine
     *
     * canvas: The ID of the canvas element
     * options: Object that contains starting options for the engine
     *          defaultCameraRotation: The starting rotation of the camera in degrees
     *          defaultCameraTilt: The starting tilt of the camera in degrees
     */
    function init(canvas, options){
        _canvasArea = $("#"+canvas).first();
        _canvasOffset = _canvasArea.offset();
        _context = document.getElementById(canvas).getContext("2d");
        _sceneWidth = _canvasArea.width();
        _sceneHeight = _canvasArea.height();
        _camera.offsetX = _sceneWidth / 2;
        _camera.offsetY = _sceneHeight / 2;

        if(_context){
            _isInitialised = true;
        }

        if(options){
            if(options.defaultCameraRotation){
                _camera.defaultCameraRotation = _utilities.roundNumber(options.defaultCameraRotation * ( Math.PI / 180), 2);
            }
            if(options.defaultCameraPitch){
                _camera.defaultCameraPitch = -_utilities.roundNumber(options.defaultCameraPitch * ( Math.PI / 180), 2);
            }
            if(options.defaultCameraRoll){
                _camera.defaultCameraRoll = _utilities.roundNumber(options.defaultCameraRoll * ( Math.PI / 180), 2);
            }
            if(options.maxFPS){
                _maxRenderTime = _utilities.roundNumber(1000 / options.maxFPS, 2);
            }
            if(options.buildingName){
                _buildingKey = options.buildingName;
            }
            if(options.level){
                _level = options.level
            }
            if(options.isMobile != undefined){
                _isMobile = options.isMobile;
            }
        }

        var _canvasTemp = document.getElementById(canvas);

        if(_isTouchable){
            _canvasTemp.addEventListener('touchstart', _gestures.touchStart);
            _canvasTemp.addEventListener('touchmove', _gestures.touchMove);
            _canvasTemp.addEventListener('touchend', _gestures.touchEnd);
            _canvasTemp.addEventListener('touchcancel', _gestures.touchEnd);

            //Control setup
            $("#interior_conrtols_panUp > a").click(function(){_camera.controlPanCameraY(-10);});
            $("#interior_conrtols_panDown > a").click(function(){_camera.controlPanCameraY(10);});
            $("#interior_conrtols_panleft > a").click(function(){_camera.controlPanCameraX(-10);});
            $("#interior_conrtols_panRight > a").click(function(){_camera.controlPanCameraX(10);});
            $("#interior_conrtols_rotateLeft > a").click(function(){_camera.controlRotateCamera(-0.02);});
            $("#interior_conrtols_rotateRight > a").click(function(){_camera.controlRotateCamera(0.02);});
            $("#interior_conrtols_ZoomIn > a").click(function(){_camera.controlZoomCamera(-50);});
            $("#interior_conrtols_ZoomOut > a").click(function(){_camera.controlZoomCamera(50);});
        } else{
            _canvasArea.mousedown(_mouse.mouseDown);
            _canvasArea.mouseup(_mouse.mouseUp);
            _canvasArea.mousemove(_mouse.mouseMove);
            _canvasTemp.addEventListener('mousewheel', _mouse.mouseWheel);
            _canvasTemp.addEventListener('DOMMouseScroll', _mouse.mouseWheel);

            //Control setup
            _mouse.mouseHold("interior_conrtols_panUp > a",_camera.controlPanCameraY,-10,100,1);
            _mouse.mouseHold("interior_conrtols_panDown > a",_camera.controlPanCameraY,10,100,1);
            _mouse.mouseHold("interior_conrtols_panleft > a",_camera.controlPanCameraX,-10,100,1);
            _mouse.mouseHold("interior_conrtols_panRight > a",_camera.controlPanCameraX,10,100,1);
            _mouse.mouseHold("interior_conrtols_rotateLeft > a",_camera.controlRotateCamera,-0.02,100,1.2);
            _mouse.mouseHold("interior_conrtols_rotateRight > a",_camera.controlRotateCamera,0.02,100,1.2);
            _mouse.mouseHold("interior_conrtols_ZoomIn > a",_camera.controlZoomCamera,-10,100,1.1);
            _mouse.mouseHold("interior_conrtols_ZoomOut > a",_camera.controlZoomCamera,10,100,1.1);
        }
    }

    function updateInstance(){
        if(_canvasArea){
            _canvasOffset = _canvasArea.offset();
            _sceneWidth = _canvasArea.width();
            _sceneHeight = _canvasArea.height();
        }

        _camera.offsetX = _sceneWidth / 2;
        _camera.offsetY = _sceneHeight / 2;
    }

    function render(skipTimeCheck){
        if(!_isInitialised){
            // $.error("ums_3d is not initialised, unable to render the scene.");
            return;
        }

        var renderDif = new Date().getTime() - _lastRenderTime;
        if(renderDif < _maxRenderTime && !skipTimeCheck){
            return;
        }

        _utilities.startTimer();

        _context.width = _sceneWidth;
        _context.fillStyle = "#f5f5f5";
        _context.fillRect(0, 0, _sceneWidth, _sceneHeight);

        //New Render method
        var itms = [], i = _toDraw.length;
        while(i--){
            _toDraw[i].update();
            itms.push.apply(itms, _toDraw[i].getRenderItems());
        }

        itms.sort(function(a, b){
            return a.zIndex - b.zIndex;
        });

        var zindexs = [];
        for(i = 0; i< itms.length; i++){
            var zdex = "z"+itms[i].zIndex,
                c = itms[i].color;

            if(zindexs[zdex] == undefined){
                zindexs[zdex] = [];
            }

            if(zindexs[zdex][c] == undefined){
                zindexs[zdex][c] = [itms[i]];
            }else{
                zindexs[zdex][c].push(itms[i]);
            }
        }

        for(var z in zindexs){
            for(i in zindexs[z]){
                if(!zindexs[z][i].length){continue;}
                _context.strokeStyle = i;
                _context.fillStyle = i;
                var colorGroup = zindexs[z][i];

                for(var x = 0; x < colorGroup.length; x++){
                    switch(colorGroup[x].drawType)
                    {
                        case _drawType.triangle:
                            if(colorGroup[x].points[0] == null || colorGroup[x].points[1] == null || colorGroup[x].points[2] == null){continue;}
                            _context.lineWidth = colorGroup[x].thick;
                            _context.beginPath();
                            _context.moveTo(colorGroup[x].points[0].x, colorGroup[x].points[0].y);
                            _context.lineTo(colorGroup[x].points[1].x, colorGroup[x].points[1].y);
                            _context.lineTo(colorGroup[x].points[2].x, colorGroup[x].points[2].y);
                            _context.fill();
                            break;
                        case _drawType.line:
                            if(colorGroup[x].points[0] == null || colorGroup[x].points[1] == null){continue;}
                            _context.lineWidth = colorGroup[x].thick;
                            _context.beginPath();
                            _context.moveTo(colorGroup[x].points[0].x, colorGroup[x].points[0].y);
                            _context.lineTo(colorGroup[x].points[1].x, colorGroup[x].points[1].y);
                            _context.stroke();
                            break;
                        case _drawType.point:
                            if(colorGroup[x].points[0] == null){continue;}
                            _context.lineWidth = colorGroup[x].thick;
                            _context.fillRect(colorGroup[x].points[0].x - (colorGroup[x].thick / 2), colorGroup[x].points[0].y - (colorGroup[x].thick / 2), colorGroup[x].thick, colorGroup[x].thick);
                            break;
                        case _drawType.polygon:
                            if(colorGroup[x].points[0] == null){continue;}
                            _context.lineWidth = colorGroup[x].thick;
                            _context.beginPath();
                            _context.moveTo(colorGroup[x].points[0].x, colorGroup[x].points[0].y);
                            for(var p = 1; p <colorGroup[x].points.length; p ++){
                                if(colorGroup[x].points[p] == null){continue;}
                                _context.lineTo(colorGroup[x].points[p].x, colorGroup[x].points[p].y);
                            }
                            _context.fill();
                            break;
                        case _drawType.text:
                            if(colorGroup[x].points[0] == null){continue;}
                            _context.font = colorGroup[x].font;
                            _context.strokeStyle = "#FFFFFF";
                            _context.strokeText(colorGroup[x].text, colorGroup[x].points[0].x, colorGroup[x].points[0].y + 1);
                            _context.fillText(colorGroup[x].text, colorGroup[x].points[0].x, colorGroup[x].points[0].y);
                            break;
                        case _drawType.image:
                            _context.lineWidth = 0;
                            if(colorGroup[x].points[0] == null){continue;}
                            for(var t = 0; t<colorGroup[x].transforms.length; t++){
                                var trans = colorGroup[x].transforms[t];
                                _context.save();
                                _context.beginPath();
                                _context.moveTo(trans.points[0].x,trans.points[0].y);
                                _context.lineTo(trans.points[1].x,trans.points[1].y);
                                _context.lineTo(trans.points[2].x,trans.points[2].y);
                                _context.closePath();
                                _context.clip();
                                _context.transform( trans.delta_a/trans.delta,
                                                    trans.delta_b/trans.delta,
                                                    trans.delta_c/trans.delta,
                                                    trans.delta_d/trans.delta,
                                                    trans.delta_e/trans.delta,
                                                    trans.delta_f/trans.delta);
                                _context.drawImage(colorGroup[x].img,0,0);
                                _context.restore();
                            }
                            break;
                        case _drawType.image_2D:
                            _context.save();
                            _context.drawImage(colorGroup[x].img,colorGroup[x].points[0].x,colorGroup[x].points[0].y,colorGroup[x].width,colorGroup[x].height);
                            _context.restore();
                            break;
                        default:
                            //TODO: Log item was attempted to be drawn that has no appropriate type
                            break;
                    }
                }
            }
        }
        _utilities.renderCompass();
        _lastRenderTime = new Date().getTime();
    }

    function clearCanvas(){
        if(_context) {
            _context.width = _sceneWidth;
            _context.fillStyle = "#F2F2F2";
            _context.fillRect(0, 0, _sceneWidth, _sceneHeight);
            render();
        }

        _toDraw = [];
        _lastRenderTime = 0;
        _renderTimer = null;
        
    }

    function Point_3D(pos, options){
        options = options != undefined? options : {};
        var _x = pos.x != undefined? pos.x : 0,
            _y = pos.y != undefined? pos.y: 0 ,
            _z = pos.z != undefined? pos.z: 0,
            _fill = options.fillColor != undefined? options.fillColor : "#000000",
            _thick = 2,
            _2D = _utilities.transform2D(_x,_y,_z);

        this.getType = function(){
            return _drawType.point;
        };

        this.getBoundingBox = function () {
            return {
                min:{x:_2D.x - 1, y:_2D.y - 1, z:_2D.z - 1},
                max:{x:_2D.x + 1, y:_2D.y + 1, z:_2D.z + 1}
            };
        };

        this.getRenderItems = function(){
            return [{
                drawType: _drawType.point,
                zIndex: _utilities.getZIndex([_2D]),
                color: _fill,
                thick: _thick,
                points: [_2D]
            }];
        };

        this.update = function(){
            _2D = _utilities.transform2D(_x,_y,_z);
        }

    }

    function Line_3D(start,end,options){

        options = options != undefined? options : {};

        var _start = start != null || undefined? start : {x: 0, y: 0, z: 0},
            _end = end != null || undefined? end : {x: 0, y: 0, z: 0},
            _stroke = options.lineColor != undefined? options.lineColor : "#000000",
            _thick = options.lineThickness != undefined? options.lineThickness : 1,
            _start2D = _utilities.transform2D(_start.x,_start.y,_start.z),
            _end2D = _utilities.transform2D(_end.x,_end.y,_end.z);

        this.getType = function(){
            return _drawType.line;
        };

        this.getBoundingBox = function(){
            var maxX = _start.x,
                maxY = _start.y,
                maxZ = _start.z,
                minX = _start.x,
                minY = _start.y,
                minZ = _start.z;

            if(_end.x > maxX){maxX = _end.x;}
            else{minX = _end.x;}

            if(_end.y > maxY){maxY = _end.y;}
            else{minY = _end.y;}

            if(_end.z > maxZ){maxZ = _end.z;}
            else{minZ = _end.z;}

            return {
                min: {x: minX, y: minY, z: minZ},
                max: {x: maxX, y: maxY, z: maxZ}
            };
        };

        this.getRenderItems = function(){
            return [{
                drawType: _drawType.line,
                zIndex: _utilities.getZIndex([_start2D, _end2D]),
                color: _stroke,
                thick: _thick,
                points: [_start2D, _end2D]
            }];
        };

        this.update = function(){
            _start2D = _utilities.transform2D(_start.x,_start.y,_start.z);
            _end2D = _utilities.transform2D(_end.x,_end.y,_end.z);
        };
    }

    function Poly_3D(points, triangles, options){
        // console.log("S:"+points+" R:"+options.lineColor+" T:"+options.lineThickness);
        options = options != undefined? options : {};
        options.metaData = options.metaData != undefined? options.metaData : {};
        options.metaData.name = options.metaData.name != undefined? options.metaData.name : "";
        triangles = triangles != undefined? triangles : [];
        var _path = points,
            _path_2D = [],
            _triangleIndexs = triangles,
            _triangles = [],
            _stroke = options.lineColor != undefined? options.lineColor : "#000000",
            _thick = options.lineThickness != undefined? options.lineThickness : 1,
            _fill = options.fillColor != undefined? options.fillColor : "#FFFFFF",
            _wireframe = options.wireframe != undefined? options.wireframe : false,
            _showEdges = options.showEdges != undefined? options.showEdges : false,
            _fillShape = options.showFill != undefined? options.showFill : true,
            _extrudeColor = "#6CB800",
            _image = options.image != undefined? options.image : null,
            _boundingBox = {min:{x:0,y:0,z:0}, max:{x:0,y:0,z:0}},
            _disableExtrude = options.disableExtrusion != undefined? options.disableExtrusion : false,
            _extruded = false,
            _extrudedPolys = [],
            _metaData = options.metaData;

        if(_image != null){
            _image.img = new Image();
            _image.src = _image.src != undefined? _image.src : "";
            _image.img.src = _image.src;
            _image.width = _image.width != undefined? _image.width : 0;
            _image.height = _image.height != undefined? _image.height : 0;
            _image.topLeft = _image.topLeft != undefined? _image.topLeft : 0;
            _image.show = true;
        }

        this.getType = function(){
            return _drawType.polygon;
        };

        this.getBoundingBox = function(){
            return _boundingBox;
        };

        this.update = function(){
            var maxX = null,
                maxY = null,
                maxZ = null,
                minX = null,
                minY = null,
                minZ = null;

            _path_2D = [];
            for(var i = 0; i < _path.length; i++){
                var p = _utilities.transform2D(_path[i].x, _path[i].y, _path[i].z);
                _path_2D.push(p);

                if(p == null){continue;}

                if(maxX == null || p.x > maxX){maxX = p.x;}
                if(minX == null || p.x < minX){minX = p.x;}

                if(maxY == null || p.y > maxY){maxY = p.y;}
                if(minY == null || p.y < minY){minY = p.y;}

                if(maxZ == null || p.z > maxZ){maxZ = p.z;}
                if(minZ == null || p.z < minZ){minZ = p.z;}
            }

            _boundingBox = {
                min: {x: minX, y: minY, z: minZ},
                max: {x: maxX, y: maxY, z: maxZ}
            };

            if(_image != null && _path.length == 4 && _image.show){
                _image.transforms = [];
                var tris = [[_image.topLeft,(_image.topLeft + 1) % 4,(_image.topLeft + 2) % 4 ],[(_image.topLeft + 2) % 4,(_image.topLeft + 3) % 4,_image.topLeft]],
                    textureMap = [
                        [{u:0,v:0},{u:_image.width,v:0},{u:_image.width,v:_image.height}],
                        [{u:_image.width,v:_image.height},{u:0,v:_image.height},{u:0,v:0}]
                    ];


                for(var t = 0; t<tris.length;t++){
                    var pts = tris[t];
                    var tm = textureMap[t];

                    var x0 = _path_2D[pts[0]].x, x1 = _path_2D[pts[1]].x, x2 = _path_2D[pts[2]].x;
                    var y0 = _path_2D[pts[0]].y, y1 = _path_2D[pts[1]].y, y2 = _path_2D[pts[2]].y;
                    var u0 = tm[0].u, u1 = tm[1].u, u2 = tm[2].u;
                    var v0 = tm[0].v, v1 = tm[1].v, v2 = tm[2].v;

                    _image.transforms.push({
                            points: [{x:x0,y:y0},{x:x1,y:y1},{x:x2,y:y2}],
                            delta: u0*v1 + v0*u2 + u1*v2 - v1*u2 - v0*u1 - u0*v2, //Matrix Determinant
                            delta_a: x0*v1 + v0*x2 + x1*v2 - v1*x2 - v0*x1 - x0*v2, //Scale X
                            delta_b: y0*v1 + v0*y2 + y1*v2 - v1*y2 - v0*y1 - y0*v2, //Skew X
                            delta_c: u0*x1 + x0*u2 + u1*x2 - x1*u2 - x0*u1 - u0*x2, //Skew Y
                            delta_d: u0*y1 + y0*u2 + u1*y2 - y1*u2 - y0*u1 - u0*y2, //Scale Y
                            delta_e: u0*v1*x2 + v0*x1*u2 + x0*u1*v2 - x0*v1*u2 - v0*u1*x2 - u0*x1*v2, //Translate X
                            delta_f: u0*v1*y2 + v0*y1*u2 + y0*u1*v2 - y0*v1*u2 - v0*u1*y2 - u0*y1*v2 //Translate Y
                    });
                }
            }

            _triangles = [];
            for(var i =0; i < _triangleIndexs.length; i++){
                var a = _path_2D[_triangleIndexs[i][0]],
                    b = _path_2D[_triangleIndexs[i][1]],
                    c = _path_2D[_triangleIndexs[i][2]];
                if(a != null && b != null && c != null){
                    var z = _utilities.roundNumber((a.z + b.z + c.z) / 3, 2);
                    _triangles.push({
                        a: a,
                        b: b,
                        c: c,
                        z: z
                    });
                }
            }

            this.updateBubble();
        };

        this.getRenderItems = function(){
            var items = [];

            if(_fillShape){
                if(_triangles.length == 0){
                    items.push({
                        drawType: _drawType.polygon,
                        zIndex:  _utilities.getZIndex(_path_2D),
                        color: _fill,
                        thick: 1,
                        points: _path_2D
                    });
                }else{
                    for(var i = 0; i < _triangles.length; i++){
                        items.push({
                            drawType: _drawType.triangle,
                            zIndex: _triangles[i].z,
                            color: _fill,
                            thick: 1,
                            points: [_triangles[i].a, _triangles[i].b, _triangles[i].c]
                        });
                    }
                }
            }

            if(_showEdges || _wireframe){
                for(var i = 0; i<_path_2D.length; i++){
                    var j = (i+1) % _path_2D.length;
                    items.push({
                        drawType: _drawType.line,
                        zIndex: _utilities.getZIndex([_path_2D[i], _path_2D[j]]),
                        color: _stroke,
                        thick: _thick,
                        points: [_path_2D[i], _path_2D[j]]
                    });
                }
            }

            if(_image != null && _image.show){
                items.push({
                   drawType: _drawType.image,
                   zIndex:  _utilities.getZIndex(_path_2D),
                   img: _image.img,
                   transforms: _image.transforms,
                   points:[_path_2D[_image.topLeft]]
                });
            }

            if(_metaData.showLabel){
                var text = _metaData.name == "E"? "Entrance" : _metaData.name;
                $("body").append("<span id='tempTextWidth' style='visibility: hidden;height:auto;width:auto;font:bold 12px arial'>"+text+"</span>");
                var width = $("#tempTextWidth").width(),
                    center = {
                    x: (_boundingBox.min.x + _boundingBox.max.x - width) / 2,
                    y: (_boundingBox.min.y + _boundingBox.max.y - 12) / 2,
                    z: (_boundingBox.min.z + _boundingBox.max.z) / 2
                };
                items.push({
                    drawType: _drawType.text,
                    zIndex: 5,
                    color: "#000000",
                    font:  "bold 12px arial",
                    text: text,
                    points: [center]
                });
                $("#tempTextWidth").remove();
            }

            if(_extruded){
                for(var i = 0; i < _extrudedPolys.length; i++){
                    _extrudedPolys[i].update();
                    items.push.apply(items, _extrudedPolys[i].getRenderItems());
                }
            }

            return items;
        };

        this.pointInPoly = function(point){
            if(point.x > _boundingBox.min.x && point.x < _boundingBox.max.x && point.y > _boundingBox.min.y && point.y < _boundingBox.max.y){
                var i, j = _path_2D.length - 1, inPoly = false;
                for(i=0; i<_path_2D.length; i++){
                    if((_path_2D[i] != null && _path_2D[j] != null) && (_path_2D[i].y < point.y && _path_2D[j].y >=point.y || _path_2D[j].y < point.y && _path_2D[i].y>= point.y)){
                        if(_path_2D[i].x + (point.y - _path_2D[i].y) / (_path_2D[j].y-_path_2D[i].y)*(_path_2D[j].x-_path_2D[i].x)<point.x){
                            inPoly = !inPoly;
                        }
                    }
                    j=i;
                }
                return inPoly;
            }
            return false;
        };

        this.extrudeEdges = function(amount){
            if(_disableExtrude){return;}

            if(_extruded){
                return;
            }

            var lines = [], i, roofPts = [];
            var pos = {
                max:{x:_path[0].x,z:_path[0].z},
                min:{x:_path[0].x,z:_path[0].z}
            };

            for(i = 0; i<_path.length; i++){
                var next = (i+1) % _path.length;
                lines.push({ start:_path[i], end:_path[next] });
                if(_path[i].x > pos.max.x) { pos.max.x = _path[i].x; }
                if(_path[i].x < pos.min.x) { pos.min.x = _path[i].x; }
                if(_path[i].z > pos.max.z) { pos.max.z = _path[i].z; }
                if(_path[i].z < pos.min.z) { pos.min.z = _path[i].z; }
                roofPts.push({x: _path[i].x, y: _path[i].y + amount, z: _path[i].z});
            }
            var img = null;
            if(_image != null){
                _image.show = false;
                img = {
                    src: _image.src,
                    width: _image.width,
                    height: _image.height,
                    topLeft: _image.topLeft
                };
            }

            var roofPoly = new Poly_3D(roofPts, _triangleIndexs, {
                lineColor: _stroke,
                lineThickness: _thick,
                fillColor: _extrudeColor,
                wireFrame: _wireframe,
                showEdges: _showEdges,
                image: img
            });
            roofPoly.update();

            for(i = 0; i < lines.length; i++){
                var pts = [];
                pts.push(lines[i].start);
                pts.push(lines[i].end);
                pts.push({x: lines[i].end.x, y: lines[i].end.y + amount, z: lines[i].end.z});
                pts.push({x: lines[i].start.x, y: lines[i].start.y + amount, z: lines[i].start.z});

                var poly = new Poly_3D(pts,
                    [
                        //[0,1,3],
                        //[1,2,3]
                    ],
                    {
                    lineColor: _stroke,
                    lineThickness: _thick,
                    fillColor: _extrudeColor,
                    wireFrame: _wireframe,
                    showEdges: _showEdges
                });
                poly.update();
                _extrudedPolys.push(poly);
            }
            _extrudedPolys.push(roofPoly);
            _extruded = true;

            var pos = {
                //Add the max and min, divide by 2 then subtract half the width of the popup
                x: ((_boundingBox.max.x + _boundingBox.min.x) / 2) - _sceneWidth/2,
                //Add the max and min subtract double the extrude amount, divide by 2 then subtract the height of the popup and add the canvas offset
                y: ((_boundingBox.max.y + _boundingBox.min.y) / 2) - _sceneHeight/2
            };
            _camera.centerCamera;
            _camera.panCameraY(pos.y*-1);
            _camera.panCameraX(pos.x*-1);
            this.buildBubble();
        };

        this.clearExtrusion = function(){
            var change = false;
            if(_extrudedPolys.length > 0){
                change = true;
            }
            _extruded = false;
            _extrudedPolys = [];
            if(_metaData.popupId != undefined && _metaData.popupId != ""){
                $("#interior_popup" + _metaData.popupId).remove();
                _metaData.popupId = "";
            }
            if(_image != null){_image.show = true;}

            return change;
        };

        this.getMetadata = function(){
            return _metaData;
        };

        this.buildBubble = function(){
            if(_extruded){
                _metaData.popupId = _metaData.name.replace(/ /g, "").replace(/'/gi,""); + new Date().getTime();
                var bubble = document.createElement('DIV');
                bubble.style.position = 'absolute';
                bubble.style.zIndex = 999;
                var str = _metaData.popupId;
                var n = str.replace(/'/gi,"");
                bubble.id = 'interior_popup' + n; 
                // Content area
                var contentContainer = document.createElement('DIV');
                contentContainer.style.overflowX = 'hidden';
                contentContainer.style.overflowY = 'hidden';
                contentContainer.style.cursor = 'default';
                contentContainer.style.clear = 'both';
                contentContainer.style.position = 'relative';
                contentContainer.style.backgroundColor = '#FFFFFF';
                contentContainer.style.borderColor = '#CCCCCC';
                contentContainer.style.borderStyle = 'solid';
                contentContainer.style.borderRadius = contentContainer.style.MozBorderRadius = contentContainer.style.webkitBorderRadius = '10px';
                contentContainer.style.borderWidth = '1px';
                contentContainer.style.padding = '5px';
                contentContainer.style.whiteSpace = 'nowrap';
                contentContainer.id = 'interior_popup_contContain';

                var content = document.createElement('DIV');
                content.innerHTML = _metaData.description; //+'<br/> REF:'+ _metaData.referenceId;
                contentContainer.appendChild(content);
                var add = document.createElement('DIV');
                add.style.marginLeft = '5px';
                add.style.marginRight = '5px';
                add.innerHTML = "<a href='#' id='addRoute'><i></i><br/>Add as<br/>waypoint</a>";
                add.href="#";
                add.onclick = function(){
                        var point = {"Room":{"name":_metaData.name, "parent":{"Key":_buildingKey,"Level":_level, "Name":data_cache.lookup(_buildingKey).displayName}}};
                        Waypoint.addPoint(point);
                        updateCreatePathFieldFrom('Room');
                        $( "#progressPopup" ).text('Added room to the route');
                        $( "#progressPopup" ).popup( 'open' );
                };
                add.id = 'interior_popup_addWaypoint';
                contentContainer.appendChild(add);
                // Arrow
                var arrow = document.createElement('DIV');
                arrow.style.position = 'relative';
                arrow.style.marginTop = '-1px';

                var arrowOuter = document.createElement('DIV');
                var arrowInner = document.createElement('DIV');

                arrowOuter.style.position = 'absolute';
                arrowOuter.style.left = '50%';
                arrowOuter.style.height = '0';
                arrowOuter.style.width = '0';
                arrowOuter.style.marginLeft = '-15px';
                arrowOuter.style.borderWidth = '15px';
                arrowOuter.style.borderBottomWidth = 0;
                arrowOuter.style.borderTopWidth = '15px';
                arrowOuter.style.borderLeftWidth = '15px';
                arrowOuter.style.borderRightWidth = '15px';
                arrowOuter.style.borderColor = '#CCCCCC transparent transparent';
                arrowOuter.style.borderStyle = 'solid';

                arrowInner.style.position = 'absolute';
                arrowInner.style.left = '50%';
                arrowInner.style.height = '0';
                arrowInner.style.width = '0';
                arrowInner.style.marginLeft = '-15px';
                arrowInner.style.borderRightWidth = '14px';
                arrowInner.style.borderLeftWidth = '14px';
                arrowInner.style.borderTopWidth = '14px';
                arrowInner.style.borderColor = '#FFFFFF transparent transparent';
                arrowInner.style.borderStyle = 'solid';

                bubble.appendChild(contentContainer);
                arrow.appendChild(arrowOuter);
                arrow.appendChild(arrowInner);
                bubble.appendChild(arrow);

                $( '#interiorCanvas' ).append(bubble);
                this.updateBubble();
            }
        };

        this.updateBubble = function(){
            if(_extruded){
                var str = _metaData.popupId;
                var n = str.replace(/'/gi,"");
                var pos = {
                    //Add the max and min, divide by 2 then subtract half the width of the popup
                    x: ((_boundingBox.max.x + _boundingBox.min.x) / 2) - ($("#interior_popup"+ n).width() / 2),
                    //Add the max and min subtract double the extrude amount, divide by 2 then subtract the height of the popup and add the canvas offset
                    y: ((_boundingBox.max.y + _boundingBox.min.y - 100) / 2) - $("#interior_popup"+ n).height() + _canvasOffset.top
                };
                $("#interior_popup" + n).css('top',pos.y + 'px').css('left',pos.x + 'px');
            }
        }
    }

    function Text_2D(text, point, options){
        options = options != undefined? options : {};
        var _text = text,
            _pos_3D = point != undefined? point: {x:0,y:0,z:0},
            _pos_2D = {},
            _fontStyle = options.fontStyle != undefined? options.fontStyle : "arial",
            _fontSize = options.fontSize != undefined? options.fontSize : "12px",
            _fontWeight = options.fontWeight != undefined? options.fontWeight : "",
            _fill = options.fontColor != undefined? options.fontColor : "#000000";

        this.getType = function(){
            return _drawType.text;
        };

        this.getBoundingBox = function(){
            return {
                min: {x: _pos_2D.x, y: _pos_2D.y, z: _pos_2D.z},
                max: {x: _pos_2D.x + _context.measureText(_text).width, y: _pos_2D.y, z: _pos_2D.z}
            };
        };

        this.update = function(){
            _pos_2D = _utilities.transform2D(_pos_3D.x, _pos_3D.y, _pos_3D.z);
        };

        this.getRenderItems = function(){
            return [{
                drawType: _drawType.text,
                zIndex: _pos_2D == null? 0 : _pos_2D.z,
                color: _fill,
                font: _fontWeight + " " + _fontSize + " " + _fontStyle,
                text: _text,
                points: [_pos_2D]
            }];
        };

    }

    function Image_2D(imgURL, topLeft, width, height, options){
        options = options != undefined? options : {};
        var _url = imgURL,
            _pos_3D = topLeft != undefined? topLeft : {x:0, y:0, z:0},
            _pos_2D = {x:0, y:0, z:0},
            _w = width != undefined? width : 24,
            _h = height != undefined? height : 24,
            _boundingBox = {min:{x:0,y:0,z:0}, max:{x:0,y:0,z:0}};


        this.getType = function(){
            return _drawType.image;
        };

        this.getBoundingBox = function(){
            return _boundingBox;
        };

        this.update = function(){
            _pos_2D = _utilities.transform2D(_pos_3D.x,_pos_3D.y,_pos_3D.z);
            _pos_2D.x = _pos_2D.x - (_w / 2);
            _pos_2D.y = _pos_2D.y - (_h / 2);
            _boundingBox = {
                min: {x: _pos_2D.x, y: _pos_2D.y + _h, z: _pos_2D.z},
                max: {x: _pos_2D.x + _w, y: _pos_2D.y, z: _pos_2D.z}
            };
        };

        this.getRenderItems = function(){
            var img = new Image();
            img.src = _url;
           return [{
               drawType: _drawType.image_2D,
               zIndex: _pos_2D == null? 0 : _pos_2D.z,
               img: img,
               width: _w,
               height: _h,
               points: [_pos_2D]
           }];
        }

    }

    function addPoint(pos, options){
        _toDraw.push(new Point_3D(pos, options));
    }

    function addLine(start, end, options){
        _toDraw.push(new Line_3D(start, end, options));
    }

    function addPolygon(points, triangles, options){
        _toDraw.push(new Poly_3D(points, triangles, options));
    }

    function addText(text,point,options){
        _toDraw.push(new Text_2D(text,point,options));
    }

    function addImage(imgURL, topLeft, width, height, options) {
        _toDraw.push(new Image_2D(imgURL, topLeft, width, height, options));
    }

    function importBuildingData(buildingName, level, displayName, doRotation, extrudeName){

        UAlberta.Maps.Exterior.loadingBarToggle(true,displayName);
        $(".leftNav_interior_buildingImage").html("");
        $.ajax({
            type: "POST",
            url: _dataImport.hostUrl,
            dataType: "json",
            contentType: "application/json",
            timeout: _dataImport.timeout,
            data: _dataImport.toJSON({BuildingName: buildingName, Level: level}),
            success: function (data) {
                        _dataImport.ajaxSuccess(data, displayName, doRotation);
                        if(extrudeName != undefined){
                            extrudeRoom(extrudeName);
                        }
                    },
            error: function () {
                        _dataImport.ajaxError(displayName);
                    }
        });
    }

    function extrudeRoom(name){
        for(var i = 0; i < _toDraw.length; i++){
            if(_toDraw[i].getType() == _drawType.polygon){
                var poly = _toDraw[i], meta = poly.getMetadata();
                if(meta.name == name){
                    poly.extrudeEdges(50);
                }else{
                    poly.clearExtrusion();
                }
            }
        }
        render(true);
    }

    function loadRoatation(rotation, zoom){
        _camera.rZ = _halfPi;
        var rotIncrement = 0.025,
            zoomIncrement = (zoom - _camera.offsetZ) / ((rotation - _camera.rZ) / rotIncrement),
            rotIntervalId = setInterval(function(){
                if(rotation && _camera.rZ < rotation){
                    _camera.rotateCamera(rotIncrement);
                }

                if(zoom && _camera.offsetZ < zoom){
                    _camera.zoomCamera(zoomIncrement);
                }

                render();

                if(_camera.rZ >= rotation && _camera.offsetZ >= zoom){
                    clearInterval(rotIntervalId);
                }
            },_maxRenderTime + 10);
    }

    return {
      initialise: init,
      isInitialised: _isInitialised,
      updateInstance: updateInstance,
      render: render,
      clearCanvas: clearCanvas,
      buildingKey: _buildingKey,
      level: _level,
      camera: {
        centerCamera: _camera.centerCamera,
        panCameraX: _camera.controlPanCameraX,
        panCameraY: _camera.controlPanCameraY,
        pitchCamera: _camera.pitchCamera,
        resetCamera: _camera.resetCamera,
        rotateCamera: _camera.controlRotateCamera,
        rollCamera: _camera.rollCamera,
        zoomCamera: _camera.controlZoomCamera
      },
      addPoint: addPoint,
      addLine: addLine,
      addPolygon: addPolygon,
      addText: addText,
      addImage: addImage,
      importBuildingData: importBuildingData
    };
}(UAlberta.Maps.Interior || {}, jQuery));