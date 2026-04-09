package com.devlink.user_service.config;

import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Converter
public class ProgrammingLanguageConverter implements AttributeConverter<List<ProgrammingLanguage>, String> {

    @Override
    public String convertToDatabaseColumn(List<ProgrammingLanguage> attribute) {
        if (attribute == null || attribute.isEmpty()) return null;
        return attribute.stream()
                .map(Enum::name)
                .collect(Collectors.joining(","));
    }

    @Override
    public List<ProgrammingLanguage> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return List.of();
        return Arrays.stream(dbData.split(","))
                .map(ProgrammingLanguage::valueOf)
                .toList();
    }
}