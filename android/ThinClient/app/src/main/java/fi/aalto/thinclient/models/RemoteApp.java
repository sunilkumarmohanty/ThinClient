package fi.aalto.thinclient.models;

public class RemoteApp {
    private String name;
    private String description;
    private String remoteAccessUrl;
    private String imgSrc;
    private String instance;

    public RemoteApp(String name, String description, String remoteAccessUrl, String imgSrc) {
        this.name = name;
        this.description = description;
        this.remoteAccessUrl = remoteAccessUrl;
        this.imgSrc = imgSrc;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRemoteAccessUrl() {
        return remoteAccessUrl;
    }

    public void setRemoteAccessUrl(String remoteAccessUrl) {
        this.remoteAccessUrl = remoteAccessUrl;
    }

    public String getImgSrc() {
        return  imgSrc;
    }

    public void setImgSrc(String imgSrc) {
        this.imgSrc = imgSrc;
    }
    public String getInstance() {
        return instance;
    }

    public void setInstance(String instance) {
        this.instance = instance;
    }

}

