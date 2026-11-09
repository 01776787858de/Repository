package com.abujilan.browser;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Bitmap;
import android.view.View;
import android.view.KeyEvent;
import android.view.inputmethod.EditorInfo;
import android.webkit.*;
import android.widget.*;
import android.graphics.Color;
import android.view.Gravity;
import android.view.ViewGroup;
import android.content.Intent;
import android.net.Uri;
import java.util.*;

public class MainActivity extends Activity {
    private WebView web;
    private EditText address;
    private TextView counter;
    private int blocked = 0;
    private final Set<String> blockedHosts = new HashSet<>(Arrays.asList(
        "doubleclick.net","googlesyndication.com","googleadservices.com","adservice.google.com",
        "adnxs.com","taboola.com","outbrain.com","popads.net","popcash.net","exoclick.com",
        "propellerads.com","adsterra.com","adskeeper.co.uk","adform.net","criteo.com",
        "openx.net","rubiconproject.com","pubmatic.com","smartadserver.com","advertising.com",
        "zedo.com","adroll.com","scorecardresearch.com","amazon-adsystem.com","imasdk.googleapis.com",
        "togglevpn.app","www.togglevpn.app"
    ));
    private final String[] pathSignals = {"/ads/","/adserver/","/banner-ad","/popunder","/popup-ad","/tracking/"};

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(9,17,31));
        getWindow().setNavigationBarColor(Color.rgb(9,17,31));
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(12,12,12,8); root.setBackgroundColor(Color.rgb(9,17,31));
        TextView title = new TextView(this); title.setText("🛡️ Abu Jilan Browser"); title.setTextColor(Color.WHITE); title.setTextSize(21); title.setPadding(4,8,4,12); root.addView(title);
        LinearLayout bar = new LinearLayout(this); bar.setOrientation(LinearLayout.HORIZONTAL);
        address = new EditText(this); address.setSingleLine(true); address.setText("https://example.com"); address.setHint("https://example.com"); address.setTextColor(Color.WHITE); address.setHintTextColor(0xff9aabc2); address.setSelectAllOnFocus(true); address.setImeOptions(EditorInfo.IME_ACTION_GO);
        bar.addView(address,new LinearLayout.LayoutParams(0,dp(50),1));
        Button go = button("اذهب"); bar.addView(go,new LinearLayout.LayoutParams(dp(72),dp(50)));
        root.addView(bar);
        LinearLayout controls = new LinearLayout(this); controls.setOrientation(LinearLayout.HORIZONTAL);
        Button back=button("رجوع"), forward=button("تقدم"), refresh=button("تحديث");
        controls.addView(back,new LinearLayout.LayoutParams(0,dp(44),1)); controls.addView(forward,new LinearLayout.LayoutParams(0,dp(44),1)); controls.addView(refresh,new LinearLayout.LayoutParams(0,dp(44),1)); root.addView(controls);
        counter = new TextView(this); counter.setTextColor(0xff79dfb4); counter.setText("الإعلانات المحجوبة: 0"); counter.setPadding(4,8,4,8); root.addView(counter);
        web = new WebView(this); web.setBackgroundColor(Color.WHITE);
        WebSettings settings=web.getSettings(); settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true); settings.setJavaScriptCanOpenWindowsAutomatically(false); settings.setSupportMultipleWindows(false); settings.setLoadsImagesAutomatically(true); settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u=request.getUrl(); String host=u.getHost()==null?"":u.getHost().toLowerCase(Locale.ROOT);
                String full=u.toString().toLowerCase(Locale.ROOT);
                boolean block=false;
                for(String domain:blockedHosts) { String d=domain.trim(); if(!d.isEmpty() && (host.equals(d)||host.endsWith("."+d))) {block=true;break;} }
                if(!block) for(String signal:pathSignals) if(full.contains(signal)){block=true;break;}
                if(block){ synchronized(this){blocked++;} runOnUiThread(()->counter.setText("الإعلانات/المتعقبات المحجوبة: "+blocked)); return new WebResourceResponse("text/plain","utf-8",null); }
                return super.shouldInterceptRequest(view,request);
            }
            @Override public void onPageStarted(WebView view,String url,Bitmap icon){address.setText(url);}
            @Override public void onPageFinished(WebView view,String url){address.setText(url);}
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return false;}
        });
        root.addView(web,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,0,1));
        setContentView(root);
        go.setOnClickListener(v->loadAddress()); address.setOnEditorActionListener((v,id,event)->{if(id==EditorInfo.IME_ACTION_GO){loadAddress();return true;}return false;});
        back.setOnClickListener(v->{if(web.canGoBack())web.goBack();}); forward.setOnClickListener(v->{if(web.canGoForward())web.goForward();}); refresh.setOnClickListener(v->web.reload());
        if(state==null) web.loadUrl("https://example.com");
    }
    private int dp(int v){return (int)(v*getResources().getDisplayMetrics().density+0.5f);}
    private Button button(String text){Button b=new Button(this);b.setText(text);b.setTextColor(Color.WHITE);b.setAllCaps(false);return b;}
    private void loadAddress(){String s=address.getText().toString().trim();if(s.isEmpty())return;if(!s.matches("(?i)^https?://.*"))s="https://"+s;Uri u=Uri.parse(s);if(("http".equals(u.getScheme())||"https".equals(u.getScheme()))&&u.getHost()!=null)web.loadUrl(s);else Toast.makeText(this,"الرابط غير صالح",Toast.LENGTH_SHORT).show();}
    @Override public void onBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();}
}
