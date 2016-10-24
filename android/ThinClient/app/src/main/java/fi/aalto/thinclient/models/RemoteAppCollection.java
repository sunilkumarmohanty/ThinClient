package fi.aalto.thinclient.models;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by sunil on 09-10-2016.
 */

public class RemoteAppCollection
{
    public List<RemoteApp> remoteApps;

    // public constructor is necessary for collections
    public RemoteAppCollection() {
        remoteApps = new ArrayList<RemoteApp>();
    }
}
