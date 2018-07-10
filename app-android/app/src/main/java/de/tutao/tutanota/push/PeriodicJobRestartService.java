package de.tutao.tutanota.push;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import java.util.concurrent.TimeUnit;

public final class PeriodicJobRestartService extends JobService {

    private final static String TAG = "PeriodicJobRestart";

    @Override
    public boolean onStartJob(JobParameters params) {
        Log.i(TAG, "Restarting notification service if needed");
        startService(new Intent(this, PushNotificationService.class).putExtra("sender", "PeriodicJobRestartService"));

        // Do not finish the job immediately (return true) but finish it in five seconds.
        // This will give service some time to start. The system is holding a wake lock for us
        // while we are executing the job.
        Log.d(TAG, "Scheduling job finish");
        new Handler(Looper.getMainLooper())
                .postDelayed(() -> {
                    Log.d(TAG, "Finishing job");
                    jobFinished(params, false);
                }, TimeUnit.SECONDS.toMillis(15));
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        Log.d(TAG, "The job is finished");
        return false;
    }
}
