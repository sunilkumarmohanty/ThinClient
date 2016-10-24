package fi.aalto.thinclient.api;

import java.util.List;

import fi.aalto.thinclient.models.Instance;
import fi.aalto.thinclient.models.InstanceLaunchData;
import fi.aalto.thinclient.models.LoginData;
import fi.aalto.thinclient.models.RemoteApp;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Query;
import retrofit2.http.Url;

public interface RemoteAppsService {

    @GET("/apps")
    Call<List<RemoteApp>> getApps(@Query("lat") String action, @Query("long") String id);

    @POST("/login")
    Call<ResponseBody> login(@Body LoginData loginData);

    @GET("/logout")
    Call<ResponseBody> logout();

    @POST("/gcloud/start")
    Call<InstanceLaunchData> startInstance(@Body Instance instance);

    @GET
    Call<ResponseBody> downloadImage(@Url String fileUrl);

    @POST("/gcloud/stop")
    Call<InstanceLaunchData> stopInstance(@Body Instance instance);

}
