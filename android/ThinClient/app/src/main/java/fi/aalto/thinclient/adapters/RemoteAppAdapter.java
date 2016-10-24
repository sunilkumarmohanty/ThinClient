package fi.aalto.thinclient.adapters;

import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.support.v7.widget.CardView;
import android.support.v7.widget.RecyclerView;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import com.bumptech.glide.Glide;
import com.coboltforge.dontmind.multivnc.COLORMODEL;
import com.coboltforge.dontmind.multivnc.ConnectionBean;
import com.coboltforge.dontmind.multivnc.Constants;
import com.coboltforge.dontmind.multivnc.VncCanvasActivity;

import java.io.IOException;
import java.util.List;

import fi.aalto.thinclient.R;
import fi.aalto.thinclient.api.RemoteAppsClient;
import fi.aalto.thinclient.api.RemoteAppsService;
import fi.aalto.thinclient.models.Instance;
import fi.aalto.thinclient.models.InstanceLaunchData;
import fi.aalto.thinclient.models.RemoteApp;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RemoteAppAdapter extends RecyclerView.Adapter<RemoteAppAdapter.RemoteAppViewHolder> {

    public static class RemoteAppViewHolder extends RecyclerView.ViewHolder {

        CardView cv;
        TextView remoteAppName;
        TextView remoteAppDesc;
        ImageView remoteAppIcon;
        Button remoteAppLaunchButton;


        public RemoteAppViewHolder(View itemView) {
            super(itemView);
            itemView.getContext();
            cv = (CardView) itemView.findViewById(R.id.cv);
            remoteAppName = (TextView) itemView.findViewById(R.id.app_name);
            remoteAppDesc = (TextView) itemView.findViewById(R.id.app_desc);
            remoteAppIcon = (ImageView) itemView.findViewById(R.id.icon);
            remoteAppLaunchButton = (Button) itemView.findViewById(R.id.launch);
        }
    }

    List<RemoteApp> remoteApps;
    Context mContext;

    public RemoteAppAdapter(Context context, List<RemoteApp> remoteApps) {
        this.remoteApps = remoteApps;
        this.mContext = context;
    }

    @Override
    public void onAttachedToRecyclerView(RecyclerView recyclerView) {
        super.onAttachedToRecyclerView(recyclerView);
    }

    @Override
    public RemoteAppViewHolder onCreateViewHolder(ViewGroup viewGroup, int i) {
        View v = LayoutInflater.from(viewGroup.getContext()).inflate(R.layout.remote_app_cv_item, viewGroup, false);
        RemoteAppViewHolder pvh = new RemoteAppViewHolder(v);
        return pvh;
    }

    ProgressDialog spinner;

    @Override
    public void onBindViewHolder(final RemoteAppViewHolder remoteAppViewHolder, final int i) {
        remoteAppViewHolder.remoteAppName.setText(remoteApps.get(i).getName());
        remoteAppViewHolder.remoteAppDesc.setText(remoteApps.get(i).getDescription());

        RemoteAppsService remoteAppsService = new RemoteAppsClient(mContext).getRemoteAppsService();

        Call<ResponseBody> call = remoteAppsService.downloadImage(mContext.getResources().getString(R.string.server_url) + remoteApps.get(i).getImgSrc());

        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                try {
                    Glide.with(mContext)
                            .load(response.body().bytes())
                            .crossFade()
                            .into(remoteAppViewHolder.remoteAppIcon);
                } catch (IOException e) {
                    Log.e("IMAGE LOAD", e.getMessage(), e);
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Log.e("IMAGE LOAD", t.getMessage(), t);
            }
        });

        remoteAppViewHolder.remoteAppLaunchButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {// prepare for a progress bar dialog
                spinner = new ProgressDialog(v.getContext());
                spinner.setMessage("Loading please wait...");
                // = ProgressDialog.show(v.getContext(), "Please wait", "Loading please wait..", true);
                spinner.setCancelable(false);
                spinner.show();
                //Log.d("onClick", "starting server");
                startServer(v.getContext(), remoteApps.get(i).getInstance());
                //Log.d("onClick", "started server");
            }
        });
    }

    @Override
    public int getItemCount() {
        return remoteApps.size();
    }

    public void startServer(final Context context, final String instance) {
        RemoteAppsService remoteAppsService =
                new RemoteAppsClient(mContext).getRemoteAppsService();
        Call<InstanceLaunchData> startInstanceCall = remoteAppsService.startInstance(new Instance(instance));

        startInstanceCall.enqueue(new Callback<InstanceLaunchData>() {

            @Override
            public void onResponse(Call<InstanceLaunchData> call, Response<InstanceLaunchData> response) {
                InstanceLaunchData launchData = response.body();

                ConnectionBean conn = new ConnectionBean();
                conn.setAddress(launchData.getExternalIP());

                conn.set_Id(0); // is new!!
                conn.setPort(5901);
                Log.d("conn: ",launchData.getStatus());
                conn.setUserName("");
                conn.setPassword("mcc07vnc");
                conn.setKeepPassword(false);
                conn.setUseLocalCursor(true); // always enable
                conn.setColorModel(COLORMODEL.C24bit.nameString());
                conn.setUseRepeater(false);
                Intent intent = new Intent(mContext, VncCanvasActivity.class);
                intent.putExtra(Constants.CONNECTION, conn.Gen_getValues());
                intent.putExtra(Constants.INSTANCE_ID, instance);
                spinner.dismiss();
                context.startActivity(intent);
            }

            @Override
            public void onFailure(Call<InstanceLaunchData> call, Throwable t) {
                // Log error here since request failed
                Log.e("Error", t.toString());
            }
        });
    }
}
