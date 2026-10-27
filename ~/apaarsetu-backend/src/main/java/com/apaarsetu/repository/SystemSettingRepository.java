package com.apaarsetu.repository;

import com.apaarsetu.domain.SystemSetting;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemSettingRepository extends MongoRepository<SystemSetting, String> {
}
