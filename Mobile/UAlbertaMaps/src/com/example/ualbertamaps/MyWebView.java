package com.example.ualbertamaps;
import org.apache.cordova.CordovaWebView;

import android.content.Context;
import android.graphics.Canvas;

public class MyWebView extends CordovaWebView {
    public static final String TAG = "MyWebView";

    public MyWebView(Context context) {
        super(context);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        invalidate();
    }

}