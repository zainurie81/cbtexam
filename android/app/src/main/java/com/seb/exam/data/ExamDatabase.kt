package com.seb.exam.data

import android.content.Context
import androidx.room.*

@Entity(tableName = "offline_logs")
data class OfflineLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "session_id") val sessionId: Long,
    @ColumnInfo(name = "event_type") val eventType: String,
    @ColumnInfo(name = "message") val message: String,
    @ColumnInfo(name = "occurred_at") val occurredAt: Long,
    @ColumnInfo(name = "is_synced") val isSynced: Boolean = false
)

@Dao
interface OfflineLogDao {
    @Insert
    suspend fun insertLog(log: OfflineLog)

    @Query("SELECT * FROM offline_logs WHERE is_synced = 0 ORDER BY occurred_at ASC")
    suspend fun getUnsyncedLogs(): List<OfflineLog>

    @Query("UPDATE offline_logs SET is_synced = 1 WHERE id = :id")
    suspend fun markSynced(id: Long)

    @Query("DELETE FROM offline_logs WHERE is_synced = 1")
    suspend fun clearSyncedLogs()
}

@Database(entities = [OfflineLog::class], version = 1, exportSchema = false)
abstract class ExamDatabase : RoomDatabase() {
    abstract fun offlineLogDao(): OfflineLogDao

    companion object {
        @Volatile
        private var INSTANCE: ExamDatabase? = null

        fun getDatabase(context: Context): ExamDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    ExamDatabase::class.java,
                    "exam_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
