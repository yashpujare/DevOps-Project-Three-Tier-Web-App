import os
import mysql.connector


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "db"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "emergency_finder")
    )


def get_exits():
    conn = get_db_connection()

    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            exit_key AS id,
            name,
            row_idx AS `row`,
            col_idx AS `col`
        FROM emergency_exits
        WHERE is_active = 1
    """)

    exits = cursor.fetchall()

    cursor.close()
    conn.close()

    return exits
def save_evacuation_log(start_row, start_col, exit_used, distance_meters):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO evacuation_logs
        (start_row, start_col, exit_used, distance_meters)
        VALUES (%s, %s, %s, %s)
    """, (
        start_row,
        start_col,
        exit_used,
        distance_meters
    ))

    conn.commit()

    cursor.close()
    conn.close()