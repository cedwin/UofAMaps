package com.example.ualbertamaps;

import org.apache.cordova.CordovaChromeClient;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CordovaWebViewClient;
import org.apache.cordova.DroidGap;

import android.os.Bundle;
import android.view.Menu;
import android.view.Window;
import android.webkit.WebSettings.RenderPriority;

public class MainActivity extends DroidGap {
	
	@Override
	public void init(){
	    CordovaWebView webView = new MyWebView(MainActivity.this);
	    super.init(webView, new CordovaWebViewClient(this, webView), new CordovaChromeClient(this, webView));
	}
	
	@Override
	public void onCreate(Bundle savedInstanceState) {
		this.requestWindowFeature(Window.FEATURE_NO_TITLE);
		super.onCreate(savedInstanceState);
//		super.setIntegerProperty("splashscreen", R.drawable.ic_launcher_web);
		super.loadUrl("http://scdev06.srv.ualberta.ca:443");
//		super.loadUrl("http://142.244.150.62:8000");
		this.appView.getSettings().setRenderPriority(RenderPriority.HIGH);
	    this.appView.getSettings().setPluginState(android.webkit.WebSettings.PluginState.ON_DEMAND);
//		super.set setContentView();
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}

}
