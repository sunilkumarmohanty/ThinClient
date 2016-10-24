package fi.aalto.thinclient;

import android.content.Intent;
import android.location.Location;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Toast;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.GoogleApiClient.ConnectionCallbacks;
import com.google.android.gms.common.api.GoogleApiClient.OnConnectionFailedListener;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;

import java.util.List;

import fi.aalto.thinclient.adapters.RemoteAppAdapter;
import fi.aalto.thinclient.api.RemoteAppsClient;
import fi.aalto.thinclient.api.RemoteAppsService;
import fi.aalto.thinclient.models.RemoteApp;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity implements
        ConnectionCallbacks, OnConnectionFailedListener, LocationListener {
    private RecyclerView rv;
    private android.os.Handler handler = new android.os.Handler();
    protected static final String TAG = "Main Activity";
    protected GoogleApiClient mGoogleApiClient;
    protected Location mLastLocation;
    private String latitude;
    private String longitude;

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        try {
            super.onCreate(savedInstanceState);
            setContentView(R.layout.activity_main);

            Toolbar myToolbar = (Toolbar) findViewById(R.id.main_toolbar);
            setSupportActionBar(myToolbar);

            rv = (RecyclerView) findViewById(R.id.rv);
            LinearLayoutManager llm = new LinearLayoutManager(this);
            rv.setLayoutManager(llm);
            rv.setHasFixedSize(true);
            buildGoogleApiClient();

        } catch (Exception e) {
            Log.e("API", e.getMessage());
        }
    }

    @Override
    protected void onStart() {
        try{
        super.onStart();
        Log.i(TAG, "Google Api started");
        mGoogleApiClient.connect();
        Log.i(TAG, "Google Api connected");
    }catch  (Exception e) {
            Log.e("API", e.getMessage());
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (mGoogleApiClient.isConnected())
            mGoogleApiClient.disconnect();
    }

    private void initializeData() {
        try {
            RemoteAppsService remoteAppsService = new RemoteAppsClient(getApplicationContext()).getRemoteAppsService();
            Log.i(TAG, "QS"+latitude+"#"+longitude);
            Call<List<RemoteApp>> getAppsCall = remoteAppsService.getApps(latitude,longitude);
            getAppsCall.enqueue(new Callback<List<RemoteApp>>() {

                @Override
                public void onResponse(Call<List<RemoteApp>> call, Response<List<RemoteApp>> response) {
                    List<RemoteApp> remoteApps = response.body();
                    rv.setAdapter(new RemoteAppAdapter(getApplicationContext(), remoteApps));
                }

                @Override
                public void onFailure(Call<List<RemoteApp>> call, Throwable t) {
                    // Log error here since request failed
                    Log.e("Error", t.toString());
                }
            });
        } catch (Exception e) {
            Log.e("Error", e.getMessage());
        }

    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.action_logout:
                RemoteAppsService service = new RemoteAppsClient(getApplicationContext())
                        .getRemoteAppsService();
                Call<ResponseBody> logoutCall = service.logout();
                logoutCall.enqueue(new Callback<ResponseBody>() {
                    @Override
                    public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                        Intent intent = new Intent(MainActivity.this, LoginActivity.class);
                        intent.setFlags(intent.getFlags());
                        startActivity(intent);
                    }

                    @Override
                    public void onFailure(Call<ResponseBody> call, Throwable t) {
                        Log.e("API", "Logout error", t);
                        Toast.makeText(getApplicationContext(), "Logout error...", Toast.LENGTH_SHORT).show();
                    }
                });
                return true;

            default:
                // If we got here, the user's action was not recognized.
                // Invoke the superclass to handle it.
                return super.onOptionsItemSelected(item);
        }
    }

    protected synchronized void buildGoogleApiClient() {
        mGoogleApiClient = new GoogleApiClient.Builder(this)
                .addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this)
                .addApi(LocationServices.API)
                .build();
    }
    LocationRequest mLocationRequest;
    @Override
    public void onConnected(@Nullable Bundle bundle) {
        Log.i(TAG, "Location Connected");
        mLocationRequest = LocationRequest.create();
        mLocationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        mLocationRequest.setInterval(500);
        Log.i(TAG, "Location Requested");
        try {
            mLastLocation = LocationServices.FusedLocationApi.getLastLocation(mGoogleApiClient);
            if (mLastLocation != null) {
                latitude = Double.toString(mLastLocation.getLatitude());
                longitude = Double.toString(mLastLocation.getLongitude());
                Log.i(TAG, "OC: "+latitude);
                Log.i(TAG, "OC: "+longitude);

            }
            else
            {
                LocationServices.FusedLocationApi.requestLocationUpdates(mGoogleApiClient,mLocationRequest,this);
            }
            //Log.i(TAG, mLastLocation.toString());
        }catch (Exception ex)
        {
            Log.i(TAG, ex.getMessage());
        }
        finally {
            Log.i(TAG, "Finally: "+latitude+"#"+longitude);
            initializeData();
        }
    }

    @Override
    public void onConnectionSuspended(int i) {
        Log.i(TAG, "Connection suspended");
        mGoogleApiClient.connect();
    }

    public void onDisconnected() {
        Log.i(TAG, "Disconnected");
    }

    @Override
    public void onConnectionFailed(ConnectionResult result) {
        // Refer to the javadoc for ConnectionResult to see what error codes might be returned in
        // onConnectionFailed.
        Log.i(TAG, "Connection failed: ConnectionResult.getErrorCode() = " + result.getErrorCode());
    }

    @Override
    public void onLocationChanged(Location location) {
        try {
            latitude = Double.toString(location.getLatitude());
            longitude = Double.toString(location.getLongitude());
            Log.i(TAG, "Change: " + latitude);
            Log.i(TAG, "Change: " + longitude);
            initializeData();
            LocationServices.FusedLocationApi.removeLocationUpdates(mGoogleApiClient, this);
        } catch (Exception e) {
            Log.e("API", e.getMessage());
        }
    }
}
