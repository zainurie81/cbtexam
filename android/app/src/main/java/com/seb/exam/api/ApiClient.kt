package com.seb.exam.api

import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

interface ApiService {

    @POST("login")
    suspend fun login(
        @Body body: Map<String, String>
    ): Response<LoginResponse>

    @POST("device/register")
    suspend fun registerDevice(
        @Body body: Map<String, @JvmSuppressWildcards Any>
    ): Response<ResponseBody>

    @GET("exams")
    suspend fun getExams(): Response<List<ExamResponse>>

    @POST("exams/join")
    suspend fun joinExam(
        @Body body: Map<String, String>
    ): Response<JoinExamResponse>

    @POST("session/start")
    suspend fun startSession(
        @Body body: Map<String, Any>
    ): Response<SessionResponse>

    @POST("session/{id}/heartbeat")
    suspend fun sendHeartbeat(
        @Path("id") sessionId: Long,
        @Body body: Map<String, Any>
    ): Response<HeartbeatResponse>

    @Multipart
    @POST("session/{id}/violation")
    suspend fun reportViolation(
        @Path("id") sessionId: Long,
        @Part("type") type: RequestBody,
        @Part("severity") severity: RequestBody,
        @Part("details") details: RequestBody,
        @Part screenshot: MultipartBody.Part?
    ): Response<ResponseBody>

    @POST("session/{id}/log")
    suspend fun submitLog(
        @Path("id") sessionId: Long,
        @Body body: Map<String, String>
    ): Response<ResponseBody>

    @POST("session/{id}/submit")
    suspend fun submitExam(
        @Path("id") sessionId: Long
    ): Response<ResponseBody>
}

// Retrofit Payload Models
data class LoginResponse(
    val success: Boolean,
    val token: String,
    val user: UserDto
)

data class UserDto(
    val id: Long,
    val name: String,
    val email: String,
    val role: String
)

data class ExamResponse(
    val id: Long,
    val title: String,
    val description: String,
    val duration_minutes: Int,
    val token: String
)

data class JoinExamResponse(
    val success: Boolean,
    val exam: ExamDetailsDto
)

data class ExamDetailsDto(
    val id: Long,
    val title: String,
    val description: String,
    val duration_minutes: Int,
    val whitelist_urls: List<String>,
    val security_policy: SecurityPolicyDto?,
    val questions: List<QuestionDto>
)

data class SecurityPolicyDto(
    val name: String,
    val violation_weights: Map<String, String>,
    val allow_emulator: Boolean,
    val allow_developer_mode: Boolean
)

data class QuestionDto(
    val id: Long,
    val question_text: String,
    val options: List<String>
)

data class SessionResponse(
    val success: Boolean,
    val session: SessionDto
)

data class SessionDto(
    val id: Long,
    val status: String,
    val current_question_index: Int
)

data class HeartbeatResponse(
    val success: Boolean,
    val is_locked: Boolean
)

/**
 * Singleton Retrofit Client provider.
 */
object ApiClient {
    private var token: String? = null
    private var baseUrl: String = "https://wayground.com/api/"

    fun setAuthToken(authToken: String) {
        token = authToken
    }

    fun setBaseUrl(url: String) {
        baseUrl = if (url.endsWith("/")) url else "$url/"
    }

    fun getService(): ApiService {
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val requestBuilder = chain.request().newBuilder()
                    .addHeader("Accept", "application/json")
                token?.let {
                    requestBuilder.addHeader("Authorization", "Bearer $it")
                }
                chain.proceed(requestBuilder.build())
            }
            .build()

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
