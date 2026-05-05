package com.devlink.user_service.dto.request;

import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UpdateProfileRequest {


    @Size(min = 2, max = 100, message = "FULL_NAME_INVALID_LENGTH")
    private String fullName;


    @Size(max = 500, message = "COVER_IMAGE_URL_TOO_LONG")
    @Size(max = 500, message = "BIO_TOO_LONG")
    private String bio;

    @Size(max = 200, message = "SCHOOL_TOO_LONG")
    private String school;

    @Size(max = 150, message = "MAJOR_TOO_LONG")
    private String major;

    //limit 3 language
    @Size(max = 3, message = "LANGUAGES_TOO_MANY")
    private List<ProgrammingLanguage> favoriteLanguage;

    private String city;
    @Size(max = 5, message = "COUNTRY_CODE_TOO_MANY")
    private String countryCode;
    private String timezone;
}