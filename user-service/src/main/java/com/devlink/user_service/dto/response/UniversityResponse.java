package com.devlink.user_service.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class UniversityResponse {
    private String name;
    private String logo;
    
    private List<String> domains;
    
    @JsonProperty("web_pages")
    private List<String> webPages;
    
    private String country;
    
    @JsonProperty("alpha_two_code")
    private String alphaTwoCode;
    
    @JsonProperty("state-province")
    private String stateProvince;
    
    private String description;
    
    private List<String> images;
    
    public String getPrimaryDomain() {
        return (domains != null && !domains.isEmpty()) ? domains.get(0) : null;
    }
    
    public String getPrimaryWebPage() {
        return (webPages != null && !webPages.isEmpty()) ? webPages.get(0) : null;
    }
}
