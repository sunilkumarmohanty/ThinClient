package fi.aalto.thinclient.models;

public class InstanceLaunchData {
    private String name;
    private String status;
    private String externalIP;

    public InstanceLaunchData(String name, String status, String externalIP) {
        this.name = name;
        this.status = status;
        this.externalIP = externalIP;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getExternalIP() {
        return externalIP;
    }

    public void setExternalIP(String externalIP) {
        this.externalIP = externalIP;
    }
}
